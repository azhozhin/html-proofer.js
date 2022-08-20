"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const IOptions_1 = require("../interfaces/IOptions");
class Cache {
    constructor(runner, opts) {
        this.runner = runner;
        this.logger = runner.logger;
        this.options = opts || IOptions_1.EmptyOptions;
    }
    add_internal(url, metadata, found) {
        if (!this.enabled()) {
            return;
        }
        // todo
    }
    add_external(url, filenames, status_code, msg) {
        if (!this.enabled()) {
            return;
        }
        // todo
    }
    write() {
        if (!this.enabled()) {
            return;
        }
        // todo
    }
    enabled() {
        //return this.options.cache != null
        return false;
    }
}
exports.Cache = Cache;
