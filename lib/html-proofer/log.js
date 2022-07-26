// import winston from 'winston'
// import {format} from 'logform'
import log4js from 'log4js'

export class Log {
  constructor(log_level) {

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
    this.logger = inst.getLogger()
    // we want only error level to be published into stderr, this is really weird that I need two loggers to archive it
    this.err_logger = inst.getLogger('err')

    // const myFormat = format.printf((info) => {
    //   return `${info.message}`
    // })
    //
    // this.logger = winston.createLogger({
    //   level: log_level,
    //   format: winston.format.combine(
    //       myFormat,
    //       winston.format.colorize({all: true}),
    //   ),
    //   transports: [
    //     new winston.transports.Console({
    //       stderrLevels: ['error'],
    //       //debugStdout: true,
    //     }),
    //   ],
    // })
  }

  log(level, message) {
    if (level === 'error') {
      this.err_logger.log(level, message)
    } else {
      this.logger.log(level, message)
    }
  }

}