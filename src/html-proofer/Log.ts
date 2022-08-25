import log4js from 'log4js'
import {ILogger} from '../interfaces'

export class Log implements ILogger {
  private outLogger: log4js.Logger
  private errLogger: log4js.Logger

  constructor(logLevel?: string | null) {
    // todo: logLevel is not used
    const inst = log4js.configure({
      appenders: {
        stderr: {type: 'stderr', layout: {type: 'messagePassThrough'}, level: 'error'},
        stdout: {type: 'stdout', layout: {type: 'messagePassThrough'}, level: 'info'},
      },
      categories: {
        default: {appenders: ['stdout'], level: 'info'},
        err: {appenders: ['stderr'], level: 'error'},
      },
    })
    this.outLogger = inst.getLogger()
    // we want only error level to be published into stderr, this is really weird that I need two loggers to archive it
    this.errLogger = inst.getLogger('err')
  }

  log(level: string, message: string) {
    if (level === 'error') {
      this.errLogger.log(level, message)
    } else {
      this.outLogger.log(level, message)
    }
  }

}
