export class UrlValidator{
    runner
    logger
    failed_checks

    constructor(runner) {
        this.runner = runner

        this.logger = runner.logger

        this.failed_checks = []
    }
}