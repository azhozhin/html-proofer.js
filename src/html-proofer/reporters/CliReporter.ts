import {Reporter} from './Reporter'
import {ILogger} from '../../interfaces'
import {Failure} from "../Failure";

export class CliReporter extends Reporter {
  constructor(logger: ILogger) {
    super(logger)
  }

  public report() {
    const msg = []
    for (const [checkName, failures] of this.failureGroups) {
      const str = [`For the ${checkName} check, the following failures were found:\n`]

      for (const failure of failures) {
        str.push(this.formatFailure(failure))
      }
      msg.push(str.join('\n'))
    }

    this.logger.log('error', msg.join('\n'))
  }

  private formatFailure(failure: Failure): string {
    const pathStr = failure.path === '' ? '' : `At ${failure.path.replaceAll('\\', '/')}`
    const lineStr = failure.line == null ? '' : `:${failure.line}`

    let pathAndLine = `${pathStr}${lineStr}`
    pathAndLine = pathAndLine === '' ? '' : `* ${pathAndLine}:\n\n`

    const statusStr = failure.status == null ? '' : ` (status code ${failure.status})`

    const indent = pathAndLine === '' ? '* ' : '  '
    return `${pathAndLine}${indent}${failure.description}${statusStr}\n`
  }
}
