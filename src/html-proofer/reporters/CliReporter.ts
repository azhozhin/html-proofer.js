import {Reporter} from './Reporter'
import {ILogger} from '../../interfaces'
import {groupBy} from '../Utils'
import {Failure} from '../Failure'

export class CliReporter extends Reporter {
  constructor(logger: ILogger) {
    super(logger)
  }

  public report() {
    const msg = []
    // todo: this grouping/sorting/handling could be moved to Reporter itself, leave only output logic here
    const groups = groupBy(this.failures, (e: Failure) => e.checkName)
    const sortedGroups = new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])))
    const sortFun = (a: Failure, b: Failure) => a.path.localeCompare(b.path) || (+(a.line || 0) < +(b.line || 0) ? -1 : 1)
    for (const [checkName, failures] of sortedGroups) {
      const str = [`For the ${checkName} check, the following failures were found:\n`]

      for (const failure of failures.sort(sortFun)) {
        const pathStr = failure.path === '' ? '' : `At ${failure.path.replaceAll('\\', '/')}`
        const lineStr = failure.line == null ? '' : `:${failure.line}`

        let pathAndLine = `${pathStr}${lineStr}`
        pathAndLine = pathAndLine === '' ? '' : `* ${pathAndLine}:\n\n`

        const statusStr = failure.status == null ? '' : ` (status code ${failure.status})`

        const indent = pathAndLine === '' ? '* ' : '  '
        str.push(`${pathAndLine}${indent}${failure.description}${statusStr}\n`)
      }

      msg.push(str.join('\n'))
    }

    this.logger.log('error', msg.join('\n'))
  }

}
