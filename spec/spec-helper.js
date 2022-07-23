import {HTMLProofer} from '../lib/html-proofer'
import {exec} from 'node:child_process'
import * as VCR from 'axios-vcr'
import * as path from 'path'
import * as util from 'util'


export let FIXTURES_DIR = 'spec/html-proofer/fixtures'

export const capture_stderr = async (block) => {
  let stderr_output = ''
  let stdout_output = ''
  const stderr_write = process.stderr.write
  const stdout_write = process.stdout.write

  function stderr_write_(str, encoding, cb) {
    stderr_write.apply(process.stderr, arguments)
    stderr_output += str
  }

  function stdout_write_(str, encoding, cb) {
    stdout_write.apply(process.stderr, arguments)
    stdout_output += str
  }

  process.stderr.write = stderr_write_
  process.stdout.write = stdout_write_

  await block()

  process.stderr.write = stderr_write

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
  //const cassette_name = make_cassette_name(file, opts)
  // VCR.mountCassette(cassette_name/*, record: :new_episodes*/)

  const output = await capture_stderr(async () => {
    await proofer.run()
  })
  // VCR.ejectCassette(cassette_name)
  return output
  //end
}

export const make_bin = async (args) => {
  const pexec = util.promisify(exec)
  const { stdout, stderr } = await pexec(`node bin/htmlproofer.js ${args}`)
  return `${stdout}\n${stderr}`
}

export const make_cassette_name = (file, opts) => {
  const cassette_library_dir = path.join(FIXTURES_DIR, "vcr_cassettes")
  let filename
  if (file.constructor.name === 'Array') {
    filename = file.join('_')
  } else {
    filename = file.split(path.sep).slice(2).join(path.sep)
  }
  if (opts && Object.keys(opts).length>0) {
    filename += JSON.stringify(opts).replaceAll('"', '').replaceAll(':', '=')
  }
  return path.join(cassette_library_dir, filename)
}


// Simulation of Ruby
Object.defineProperty(Array.prototype, 'last', {
  get: function last() {
    if (this.length === 0) {
      return null
    }
    return this[this.length - 1]
  },
})

Object.defineProperty(Array.prototype, 'first', {
  get: function first() {
    if (this.length === 0) {
      return null
    }
    return this[0]
  },
})

Array.prototype.unique = function() {
  return [...new Set(this)]
}