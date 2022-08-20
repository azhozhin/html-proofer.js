import {IRunner, ILogger, ICache} from "../interfaces";

export class UrlValidator {
  protected runner: IRunner
  protected cache: ICache
  protected logger: ILogger

  protected failed_checks: any[];

  constructor(runner: IRunner) {
    this.runner = runner

    this.cache = runner.cache
    this.logger = runner.logger

    this.failed_checks = []
  }
}
