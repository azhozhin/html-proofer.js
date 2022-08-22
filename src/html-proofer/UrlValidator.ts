import {IRunner, ILogger, ICache} from "../interfaces";
import {Failure} from "./Failure";

export class UrlValidator {
  protected runner: IRunner
  protected cache: ICache
  protected logger: ILogger

  protected failedChecks: Failure[]

  constructor(runner: IRunner) {
    this.runner = runner

    this.cache = runner.cache
    this.logger = runner.logger

    this.failedChecks = []
  }
}
