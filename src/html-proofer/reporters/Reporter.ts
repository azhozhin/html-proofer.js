import {IReporter, ILogger} from '../../interfaces'
import {Failure} from '../Failure'
import {groupBy} from "../Utils";

export abstract class Reporter implements IReporter {
  public failures: Failure[] = []
  public readonly failureGroups: Map<string, Failure[]> = new Map()

  protected readonly logger: ILogger


  constructor(logger: ILogger) {
    this.logger = logger
  }

  setFailures(failures: Failure[]) {
    this.failures = failures

    const groups = groupBy(this.failures, (e: Failure) => e.checkName)
    const sortedGroups = new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])))
    // sort detected failures first by file path then by line
    const sortFun = (a: Failure, b: Failure) => a.path.localeCompare(b.path) || ((a.line || 0) < (b.line || 0) ? -1 : 1)

    this.failureGroups.clear()
    for (const [checkName, failures] of sortedGroups) {
      const sortedFailures = failures.sort(sortFun)
      this.failureGroups.set(checkName, sortedFailures)
    }
  }

  abstract report(): void

}
