import fs from 'fs'
import {Runner} from './html-proofer/Runner'
import {CheckType} from './html-proofer/CheckType'
import {EmptyOptions, ILogger, IOptions, IReporter, IRunner} from './interfaces/'

export * from './external'

export class HTMLProofer {
  static checkFile(file: string, opts?: IOptions, reporter?: IReporter, logger?: ILogger): IRunner {
    if (file.constructor.name !== 'String') {
      throw new Error('ArgumentError')
    }
    if (!fs.existsSync(file)) {
      throw new Error(`ArgumentError: ${file} does not exist`)
    }

    const options = opts ?? EmptyOptions
    options.type = CheckType.FILE
    return new Runner([file], options, reporter, logger)
  }

  static checkDirectory(directory: string, opts?: IOptions, reporter?: IReporter, logger?: ILogger): IRunner {
    if (!fs.existsSync(directory)) {
      throw new Error(`ArgumentError: ${directory} does not exist`)
    }

    const options = opts ?? EmptyOptions
    options.type = CheckType.DIRECTORY
    return new Runner([directory], options, reporter, logger)
  }

  static checkDirectories(directories: string[], opts?: IOptions, reporter?: IReporter, logger?: ILogger): IRunner {
    if (!Array.isArray(directories)) {
      throw new Error('ArgumentError')
    }

    const options = opts ?? EmptyOptions
    options.type = CheckType.DIRECTORY
    for (const directory of directories) {
      if (!fs.existsSync(directory)) {
        throw new Error(`ArgumentError: ${directory} does not exist`)
      }
    }
    return new Runner(directories, options, reporter, logger)
  }

  static checkLinks(links: string[], opts?: IOptions, reporter?: IReporter, logger?: ILogger): IRunner {
    if (!Array.isArray(links)) {
      throw new Error('ArgumentError')
    }
    const options = opts ?? EmptyOptions
    options.type = CheckType.LINKS
    return new Runner(links, options, reporter, logger)
  }
}

