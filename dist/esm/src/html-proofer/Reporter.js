export class Reporter {
    constructor(logger) {
        this.failures = [];
        this.logger = logger;
    }
    set_failures(failures) {
        this.failures = failures;
        // this.failures = groupBy(failures, e=>e.check_name)
        //.transform_values { |issues| issues.sort_by { |issue| [issue.path, issue.line] } } \
        //.sort
    }
    report() {
        throw new Error('HTMLProofer::Reporter subclasses must implement #report');
    }
}
