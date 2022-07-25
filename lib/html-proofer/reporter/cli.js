import {Reporter} from '../reporter.js'
import {groupBy} from '../utils.js'

export class Cli extends Reporter {
  report() {
    const msg = []
    const groups = groupBy(this.failures, e => e.check_name)
    const sorted_groups = new Map([...groups].sort())

    for (const [check_name, failures] of sorted_groups) {

      const str = [`For the ${check_name} check, the following failures were found:\n`]

      for (const failure of failures) {
        const path_str = failure.path === '' ? '' : `At ${failure.path.replaceAll('\\', '/')}`
        const line_str = failure.line == null ? '' : `:${failure.line}`

        let path_and_line = `${path_str}${line_str}`
        path_and_line = path_and_line === '' ? '' : `* ${path_and_line}:\n\n`

        const status_str = failure.status == null ? '' : ` (status code ${failure.status})`

        const indent = path_and_line === '' ? '* ' : '  '
        str.push(`${path_and_line}${indent}${failure.description}${status_str}`)
      }

      msg.push(str.join('\n'))
    }

    this.logger.log('error', msg.join('\n'))
  }

}