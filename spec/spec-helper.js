import {HTMLProofer} from '../lib/html-proofer'
import {execSync} from 'node:child_process'

export let FIXTURES_DIR = 'spec/html-proofer/fixtures'

export const capture_stderr = async (block) => {
  let output = ''
  const fn = process.stderr.write;

  function write(str, encoding, cb) {
    fn.apply(process.stderr, arguments)
    output += str
  }

  process.stderr.write = write;

  await block()

  process.stderr.write = fn

  return output
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
  //cassette_name = make_cassette_name(item, opts)
  //VCR.use_cassette(cassette_name, record: :new_episodes) do
  //    capture_stderr { proofer.run }
  await proofer.run()
  return proofer
}

export const capture_proofer_output = async (file, type, opts = {}) => {
  const proofer = make_proofer(file, type, opts)
  //const cassette_name = make_cassette_name(file, opts)
  //VCR.use_cassette(cassette_name, record: :new_episodes) do
  const output = await capture_stderr(async () => {
    await proofer.run()
  })
  return output
  //end
}

export const make_bin = (args) =>{
  let captured_stdout = ''
  let captured_stderr = ''
  try{
    captured_stdout = execSync(`node bin/htmlproofer.js ${args}`)
  }catch(err){
    captured_stderr = err.stderr.toString()
  }

  return `${captured_stdout}\n${captured_stderr}`
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