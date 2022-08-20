import {IReporter} from "../interfaces";
import {ILogger} from "../interfaces";
import {Failure} from "./Failure";


export class Reporter implements IReporter {
  failures: Array<Failure> = []

  protected logger: ILogger

  constructor(logger: ILogger) {
    this.logger = logger
  }

  set_failures(failures: Array<Failure>) {
    this.failures = failures
    // this.failures = groupBy(failures, e=>e.check_name)
    //.transform_values { |issues| issues.sort_by { |issue| [issue.path, issue.line] } } \
    //.sort

  }

  public report() {
    throw new Error('HTMLProofer::Reporter subclasses must implement #report')
  }

}
