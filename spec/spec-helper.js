import {HTMLProofer} from '../lib/html-proofer'
import {exec} from 'node:child_process'
import * as VCR from 'axios-vcr'
import * as path from 'path'
import axios from 'axios'

export let FIXTURES_DIR = 'spec/html-proofer/fixtures'

class Executor {
  static exec(command) {
    return new Promise((resolve, reject) => {
      let out = []
      let err = []
      const childProcess = exec(command, {
        maxBuffer: 1 * 1024 * 1024, // 1 Mb
      })
      childProcess.stdout.on('data', (data) => out.push(data))
      childProcess.stderr.on('data', (data) => err.push(data))
      // it is always resolve capturing exitCode
      childProcess.on('exit', code => resolve({
        stdout: out.join('\n'),
        stderr: err.join('\n'),
        exitCode: code,
      }))
    })
  }
}

export const capture_stderr = async (block) => {
  // todo: this does not work with current logger configuration
  let stderr_output = ''

  // it seems that stderr and stdout are the same
  let process_stderr_write = process.stderr.write

  process.stderr.write = (data) => {
    stderr_output += data
  }

  await block()

  process.stderr.write = process_stderr_write

  return stderr_output
}

export function make_proofer(item, type, opts) {
  switch (type) {
    case 'file':
      return HTMLProofer.check_file(item, opts)
    case 'directory':
      return HTMLProofer.check_directory(item, opts)
    case 'directories':
      return HTMLProofer.check_directories(item, opts)
    case 'links':
      return HTMLProofer.check_links(item, opts)
  }
}

export async function run_proofer(item, type, opts) {
  const proofer = make_proofer(item, type, opts)
  //const cassette_name = make_cassette_name(item, opts)
  // VCR.mountCassette(cassette_name/*, record: :new_episodes*/)
  //    capture_stderr { proofer.run }
  await proofer.run()
  // VCR.ejectCassette(cassette_name)
  return proofer
}

export const capture_proofer_output = async (file, type, opts = {}) => {
  const proofer = make_proofer(file, type, opts)
  const cassette_name = make_cassette_name(file, opts)
  if (opts['use_vcr']) {
    VCR.mountCassette(cassette_name/*, record: :new_episodes*/)
  }

  const output = await capture_stderr(async () => {
    await proofer.run()
  })
  if (opts['use_vcr']) {
    VCR.ejectCassette(cassette_name)
  }
  return output
}

export const capture_proofer_http = async (item, type, opts = {}) => {
  const proofer = make_proofer(item, type, opts)
  // const cassette_name = make_cassette_name(item, opts)
  // VCR.mountCassette(cassette_name/*, record: :new_episodes*/)

  const captured = {}
  const my_request_interceptor = axios.interceptors.request.use((request) => {
    captured['request'] = request
    return request
  }, (error) => { return Promise.reject(error) })
  const my_response_interceptor = axios.interceptors.response.use((response) => {
    captured['response'] = response
    return response
  }, (error) => { return Promise.reject(error) })

  await capture_stderr(async () => {
    await proofer.run()
  })

  axios.interceptors.request.eject(my_request_interceptor)
  axios.interceptors.response.eject(my_response_interceptor)
  // VCR.ejectCassette(cassette_name)
  return captured
}

export const exec_cli = async (args) => {
  const {stdout, stderr, exitCode} = await Executor.exec(`node bin/htmlproofer.js ${args}`)
  return {output: `${stdout}\n${stderr}`, exitCode: exitCode}
}

export const make_cassette_name = (file, opts) => {
  const cassette_library_dir = path.join(FIXTURES_DIR, 'vcr_cassettes')
  let filename
  if (file.constructor.name === 'Array') {
    filename = file.join('_')
  } else {
    filename = file.split(path.sep).slice(2).join(path.sep)
  }
  if (opts && Object.keys(opts).length > 0) {
    const suffix = sanitize_path(JSON.stringify(opts))
    filename += suffix
  }
  return path.join(cassette_library_dir, filename + '.json')
}

const sanitize_path = (path) => {
  return path.replaceAll('"', '').replaceAll(':', '=').replaceAll('/', '_').replaceAll(' ', '_')
}



