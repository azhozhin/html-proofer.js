import { EmptyOptions } from "../interfaces/IOptions";
export class Cache {
    constructor(runner, opts) {
        this.runner = runner;
        this.logger = runner.logger;
        this.options = opts || EmptyOptions;
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
