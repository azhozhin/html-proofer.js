"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cli = void 0;
const Reporter_1 = require("../Reporter");
const Utils_1 = require("../Utils");
class Cli extends Reporter_1.Reporter {
    constructor(logger) {
        super(logger);
    }
    report() {
        const msg = [];
        // todo: this grouping/sorting/handling could be moved to Reporter itself, leave only output logic here
        const groups = (0, Utils_1.groupBy)(this.failures, (e) => e.check_name);
        const sorted_groups = new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
        const sort_fn = (a, b) => a.path.localeCompare(b.path) || (+(a.line || 0) < +(b.line || 0) ? -1 : 1);
        for (const [check_name, failures] of sorted_groups) {
            const str = [`For the ${check_name} check, the following failures were found:\n`];
            for (const failure of failures.sort(sort_fn)) {
                const path_str = failure.path === '' ? '' : `At ${failure.path.replaceAll('\\', '/')}`;
                const line_str = failure.line == null ? '' : `:${failure.line}`;
                let path_and_line = `${path_str}${line_str}`;
                path_and_line = path_and_line === '' ? '' : `* ${path_and_line}:\n\n`;
                const status_str = failure.status == null ? '' : ` (status code ${failure.status})`;
                const indent = path_and_line === '' ? '* ' : '  ';
                str.push(`${path_and_line}${indent}${failure.description}${status_str}\n`);
            }
            msg.push(str.join('\n'));
        }
        this.logger.log('error', msg.join('\n'));
    }
}
exports.Cli = Cli;