import {Reporter} from '../reporter'

export class Cli extends Reporter {
  report() {
    const msg = []
    for (const [check_name, failures] of this.failures) {
      const str = [`For the ${check_name} check, the following failures were found:\n`]

      for (const failure of failures) {
        const path_str = failure.path === '' ? '' : `At ${failure.path}`
        const line_str = failure.line == null ? '' : `:${failure.line}`

        let path_and_line = `${path_str}${line_str}`
        path_and_line = path_and_line === '' ? '' : `* ${path_and_line}:\n\n`

        const status_str = failure.status==null ? '' : ` (status code ${failure.status})`

        const indent = path_and_line === '' ? '* ' : '  '
        str.push(`${path_and_line}${indent}${failure.description}${status_str}`)
      }

      msg.push(str.join('\n'))
    }

    this.logger.log('error', msg.join('\n'))
  }

}