import fs from 'fs'
import {Runner} from './html-proofer/runner.js'

export class HTMLProofer {
  static check_file(file, options = {}) {
    if (file.constructor.name !== 'String') {
      throw new Error('ArgumentError')
    }
    if (!fs.existsSync(file)) {
      throw new Error(`ArgumentError: ${file} does not exist`)
    }

    options['type'] = 'file'
    return new Runner(file, options)
  }

  static check_directory(directory, options = {}) {
    if (!fs.existsSync(directory)) {
      throw new Error(`ArgumentError: ${directory} does not exist`)
    }

    options['type'] = 'directory'
    return new Runner([directory], options)
  }

  static check_directories(directories, options = {}) {
    if (!Array.isArray(directories)) {
      throw new Error('ArgumentError')
    }

    options['type'] = 'directory'
    for (const directory of directories) {
      if (!fs.existsSync(directory)) {
        throw new Error(`ArgumentError: ${directory} does not exist`)
      }
    }
    return new Runner(directories, options)
  }

  static check_links(links, options = {}) {
    if (!Array.isArray(links)) {
      throw new Error('ArgumentError')
    }
    options['type'] = 'links'
    return new Runner(links, options)
  }
}
