import winston from 'winston'
import {format} from 'logform'

export class Log {
  constructor(log_level) {
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({format: format.simple()}),
      ],
    })
  }

  log(level, message) {
    this.log_with_color(level, message)
  }

  log_with_color(level, message) {
    this.logger.log(level, this.colorize(level, message))
  }

  colorize(level, message) {
    let color
    switch (level) {
      case 'debug':
        color = 'cyan'
        break
      case 'info':
        color = 'blue'
        break
      case 'warn':
        color = 'yellow'
        break
      case 'error':
      case 'fatal':
        color = 'red'
        break
    }
    return message
    //     if (STDOUT_LEVELS.include?(level) && $stdout.isatty) || \
    //       (STDERR_LEVELS.include?(level) && $stderr.isatty)
    //     Rainbow(message).send(color)
    // else
    //     message
    //     end
  }
}