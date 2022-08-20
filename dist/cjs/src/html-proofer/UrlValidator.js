"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlValidator = void 0;
class UrlValidator {
    constructor(runner) {
        this.runner = runner;
        this.cache = runner.cache;
        this.logger = runner.logger;
        this.failed_checks = [];
    }
}
exports.UrlValidator = UrlValidator;
