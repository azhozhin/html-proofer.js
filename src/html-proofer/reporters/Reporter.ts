import {IReporter, ILogger} from '../../interfaces'
import {Failure} from '../Failure'

export abstract class Reporter implements IReporter {
  public failures: Failure[] = []

  protected logger: ILogger

  constructor(logger: ILogger) {
    this.logger = logger
  }

  setFailures(failures: Failure[]) {
    this.failures = failures
    // this.failures = groupBy(failures, e=>e.check_name)
    // .transform_values { |issues| issues.sort_by { |issue| [issue.path, issue.line] } } \
    // .sort

  }

  abstract report(): void

}
