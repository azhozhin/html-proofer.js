import fs from 'fs'
import {Runner} from './html-proofer/Runner'
import {CheckType} from "./html-proofer/CheckType";
import {EmptyOptions, IOptions} from "./interfaces/IOptions";

export class HTMLProofer {
  static check_file(file: string, opts?: IOptions) {
    if (file.constructor.name !== 'String') {
      throw new Error('ArgumentError')
    }
    if (!fs.existsSync(file)) {
      throw new Error(`ArgumentError: ${file} does not exist`)
    }

    let options = (opts || EmptyOptions)
    options.type = CheckType.FILE
    return new Runner(file, options)
  }

  static check_directory(directory: string, opts?: IOptions) {
    if (!fs.existsSync(directory)) {
      throw new Error(`ArgumentError: ${directory} does not exist`)
    }

    let options = (opts || EmptyOptions)
    options.type = CheckType.DIRECTORY
    return new Runner([directory], options)
  }

  static check_directories(directories: Array<string>, opts?: IOptions) {
    if (!Array.isArray(directories)) {
      throw new Error('ArgumentError')
    }

    let options = (opts || EmptyOptions)
    options.type = CheckType.DIRECTORIES
    for (const directory of directories) {
      if (!fs.existsSync(directory)) {
        throw new Error(`ArgumentError: ${directory} does not exist`)
      }
    }
    return new Runner(directories, options)
  }

  static check_links(links: Array<string>, opts?:IOptions) {
    if (!Array.isArray(links)) {
      throw new Error('ArgumentError')
    }
    let options = (opts || EmptyOptions)
    options.type = CheckType.LINKS
    return new Runner(links, options)
  }
}

