export class UrlValidator {

  constructor(runner) {
    this.runner = runner

    this.cache = runner.cache
    this.logger = runner.logger

    this.failed_checks = []
  }
}