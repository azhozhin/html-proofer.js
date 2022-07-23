import winston from 'winston'
import {format} from 'logform'

export class Log {
  constructor(log_level) {

    const myFormat = format.printf((info) => {
      return `${info.message}`
    })

    this.logger = winston.createLogger({
      level: log_level,
      format: winston.format.combine(
          myFormat,
          winston.format.colorize({all: true}),
      ),
      transports: [
        new winston.transports.Console({
          stderrLevels: ['error'],
          consoleWarnLevels: ['warn'],
          //debugStdout: true,
        }),
      ],
    })
  }

  log(level, message) {
    this.logger.log(level, message)
  }

}