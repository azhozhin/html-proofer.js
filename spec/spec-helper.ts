import {HTMLProofer} from '../src/html-proofer'
import {exec} from 'node:child_process'
// @ts-ignore
import * as VCR from 'axios-vcr'
import * as path from 'path'
import axios from 'axios'
import {CheckType} from "../src/html-proofer/CheckType"
import {IRunner, IOptions} from "../src/interfaces/"

export let FIXTURES_DIR = 'spec/html-proofer/fixtures'

class Executor {
  static exec(command: string): Promise<{ stdout: string, stderr: string, exitCode: number | null }> {
    return new Promise((resolve, reject) => {
      const out: string[] = []
      const err: string[] = []
      const childProcess = exec(command, {
        maxBuffer: 1 * 1024 * 1024, // 1 Mb
      })
      childProcess!.stdout!.on('data', (data) => out.push(data))
      childProcess!.stderr!.on('data', (data) => err.push(data))
      // it is always resolve capturing exitCode
      childProcess.on('exit', code => resolve({
        stdout: out.join('\n'),
        stderr: err.join('\n'),
        exitCode: code,
      }))
    })
  }
}

export const captureProoferStderr = async (block: any): Promise<string> => {
  // todo: this does not work with current logger configuration
  let stderrOutput = ''

  const write = process.stderr.write

  process.stderr.write = (data: string) => {
    stderrOutput += data
    return true
  }

  await block()

  process.stderr.write = write

  return stderrOutput
}

export function createProofer(item: any, type: CheckType, opts: any): IRunner {
  switch (type) {
    case CheckType.FILE:
      return HTMLProofer.check_file(item, opts)
    case CheckType.DIRECTORY:
      return HTMLProofer.check_directory(item, opts)
    case CheckType.DIRECTORIES:
      return HTMLProofer.check_directories(item, opts)
    case CheckType.LINKS:
      return HTMLProofer.check_links(item, opts)
  }
}

export async function createAndRunProofer(item: any, type: CheckType, opts?: IOptions) {
  const proofer = createProofer(item, type, opts)
  // const cassette_name = make_cassette_name(item, opts)
  // VCR.mountCassette(cassette_name/*, record: :new_episodes*/)
  //    capture_stderr { proofer.run }
  await proofer.run()
  // VCR.ejectCassette(cassette_name)
  return proofer
}

export const captureProoferOutput = async (file: string | string[], type: CheckType, opts: IOptions) => {
  const proofer = createProofer(file, type, opts)
  const cassetteName = createCassetteName(file, opts)
  if (opts.use_vcr) {
    VCR.mountCassette(cassetteName/*, record: :new_episodes*/)
  }

  const output = await captureProoferStderr(async () => {
    await proofer.run()
  })
  if (opts.use_vcr) {
    VCR.ejectCassette(cassetteName)
  }
  return output
}

export const captureProoferHttp = async (item: any, type: CheckType, opts: any = {}) => {
  const proofer = createProofer(item, type, opts)
  // const cassette_name = make_cassette_name(item, opts)
  // VCR.mountCassette(cassette_name/*, record: :new_episodes*/)

  const captured: { request?: any, response?: any } = {}
  const requestInterceptor = axios.interceptors.request.use((request) => {
    captured.request = request
    return request
  }, (error) => {
    return Promise.reject(error)
  })
  const responseInterceptor = axios.interceptors.response.use((response) => {
    captured.response = response
    return response
  }, (error) => {
    return Promise.reject(error)
  })

  await captureProoferStderr(async () => {
    await proofer.run()
  })

  axios.interceptors.request.eject(requestInterceptor)
  axios.interceptors.response.eject(responseInterceptor)
  // VCR.ejectCassette(cassette_name)
  return captured
}

export const runProoferCli = async (args: string) => {
  const {stdout, stderr, exitCode} = await Executor.exec(`node dist/cjs/bin/htmlproofer.js ${args}`)
  return {output: `${stdout}\n${stderr}`, exitCode}
}

export const createCassetteName = (file: string | string[], opts: any) => {
  const cassetteLibraryDir = path.join(FIXTURES_DIR, 'vcr_cassettes')
  let filename
  if (file.constructor.name === 'Array') {
    filename = (file as string[]).join('_')
  } else {
    filename = (file as string).split(path.sep).slice(2).join(path.sep)
  }
  if (opts && Object.keys(opts).length > 0) {
    const suffix = sanitizePath(JSON.stringify(opts))
    filename += suffix
  }
  return path.join(cassetteLibraryDir, filename + '.json')
}

const sanitizePath = (p: string): string => {
  return p.replaceAll('"', '').replaceAll(':', '=').replaceAll('/', '_').replaceAll(' ', '_')
}



