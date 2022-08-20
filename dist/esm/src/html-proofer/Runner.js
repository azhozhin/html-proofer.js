var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as path from 'path';
import { Cli } from './reporter/Cli';
import { createDocument, mergeConcat, pluralize } from './Utils';
import { External } from './url_validator/External';
import { Internal } from './url_validator/Internal';
import { Url } from './attribute/Url';
import { Configuration } from './Configuration';
import { Cache } from './Cache';
import glob from 'glob';
import fs from 'fs';
import { Log } from './Log';
import { CheckType } from "./CheckType";
import { Links } from "./check/Links";
import { createCheck } from "../interfaces";
function normalize_path(source) {
    if (source.constructor.name === 'String') {
        return source.replaceAll('\\', '/');
    }
    else if (source.constructor.name === 'Array') {
        return source.map(e => e.replaceAll('\\', '/'));
    }
}
export class Runner {
    constructor(sources, opts = null) {
        this.internal_urls = new Map();
        this.external_urls = new Map();
        this._checks = null;
        this.options = Configuration.generate_defaults(opts);
        this.type = this.options.type;
        this.sources = sources;
        this.cache = new Cache(this, this.options);
        this.logger = new Log( /*this.options['log_level']*/);
        this.failures = [];
        this.before_request = [];
        this.checked_paths = new Map();
        this.checked_hashes = new Map();
        this.current_source = null;
        this.current_filename = null;
        this.reporter = new Cli(this.logger);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const checkText = pluralize(this.checks.length, 'check', 'checks');
            if (this.type === CheckType.LINKS) {
                this.logger.log('info', `Running ${checkText} (${this.format_checks_list(this.checks)}) on ${this.sources} ... \n\n`);
                if (!this.options['disable_external']) {
                    yield this.check_list_of_links();
                }
            }
            else {
                const checkNames = this.format_checks_list(this.checks);
                const localPath = normalize_path(this.sources);
                const extensions = this.options['extensions'].join(', ');
                this.logger.log('info', `Running ${checkText} (${checkNames}) in ${localPath} on *${extensions} files...\n\n`);
                yield this.check_files();
                this.logger.log('info', `Ran on ${pluralize(this.files.length, 'file', 'files')}!\n\n`);
            }
            this.cache.write();
            this.reporter.set_failures(this.failures);
            if (this.failures.length === 0) {
                this.logger.log('info', 'HTML-Proofer finished successfully.');
            }
            else {
                //@failures.uniq!
                this.report_failed_checks();
                process.exitCode = 1;
            }
        });
    }
    check_list_of_links() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const src of this.sources) {
                const url = new Url(this, src, null).toString();
                this.external_urls.set(url, []);
            }
            yield this.validate_external_urls();
        });
    }
    // Walks over each implemented check and runs them on the files, in parallel.
    // Sends the collected external URLs to Typhoeus for batch processing.
    check_files() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const result of this.process_files) {
                mergeConcat(this.external_urls, result.external_urls);
                mergeConcat(this.internal_urls, result.internal_urls);
                this.failures = this.failures.concat(result.failures);
            }
            if (!this.options['disable_external']) {
                yield this.validate_external_urls();
            }
            yield this.validate_internal_urls();
        });
    }
    get process_files() {
        // todo: this is partial implementation
        const files = this.files;
        const result = files
            .map(file => this.load_file(file.path, file.source));
        return result;
    }
    load_file(path, source) {
        const doc = createDocument(path);
        return this.check_parsed(doc, path, source);
    }
    // Collects any external URLs found in a directory of files. Also collectes
    // every failed test from process_files.
    check_parsed(html, p, source) {
        const result = {
            internal_urls: new Map(),
            external_urls: new Map(),
            failures: new Array()
        };
        for (const ch of this.checks) {
            this.current_source = source;
            this.current_filename = p;
            const check = createCheck(ch, this, html);
            this.logger.log('debug', `Running ${check.name} in ${p}`);
            const checkResult = check.run();
            mergeConcat(result.external_urls, checkResult.external_urls);
            mergeConcat(result.internal_urls, checkResult.internal_urls);
            result.failures = result.failures.concat(checkResult.failures);
        }
        return result;
    }
    validate_external_urls() {
        return __awaiter(this, void 0, void 0, function* () {
            const external_url_validator = new External(this, this.external_urls);
            external_url_validator.before_request = this.before_request;
            const validated = yield external_url_validator.validate();
            this.failures = this.failures.concat(validated);
        });
    }
    validate_internal_urls() {
        return __awaiter(this, void 0, void 0, function* () {
            const internal_link_validator = new Internal(this, this.internal_urls);
            const validated = yield internal_link_validator.validate();
            this.failures = this.failures.concat(validated);
        });
    }
    // todo: this should not be property
    get files() {
        if (this.type === CheckType.DIRECTORY) {
            // todo: this is too complicated
            let files = this.sources.map((src) => {
                // glob accepts only forward slashes, on Windows path separator is backslash, thus should be converted
                const pattern = path.join(src, '**', `*${this.options['extensions'].join(',')}`).replace(/\\/g, '/');
                return glob.sync(pattern)
                    .filter(file => (fs.existsSync(file) && !this.ignore_file(file)))
                    .map(f => ({
                    source: src,
                    path: f
                }));
            }).flat();
            return files;
        }
        if (this.type === CheckType.FILE && this.options['extensions'].includes(path.extname(this.sources))) {
            let files = [this.sources].filter(f => !this.ignore_file(f)).map(f => ({
                source: f,
                path: f
            }));
            return files;
        }
        return [];
    }
    ignore_file(file) {
        for (const pattern of this.options['ignore_files']) {
            if (pattern.constructor.name === 'String' && pattern === file) {
                return true;
            }
            if (pattern.constructor.name === 'RegExp' && file.match(pattern)) {
                return true;
            }
        }
        return false;
    }
    check_sri() {
        return this.options.check_sri || false;
    }
    enforce_https() {
        return this.options.enforce_https || false;
    }
    get checks() {
        if (this._checks) {
            return this._checks;
        }
        if (this.type === CheckType.LINKS) {
            this._checks = [Links];
            return this._checks;
        }
        this._checks = this.options.checks;
        return this._checks;
    }
    get failed_checks() {
        // todo: should it flatten?
        return this.reporter.failures.flat().filter(f => f.constructor.name === 'Failure');
    }
    report_failed_checks() {
        this.reporter.report();
        const failure_text = pluralize(this.failures.length, 'failure', 'failures');
        this.logger.log('error', `\nHTML-Proofer found ${failure_text}!`);
    }
    // # Set before_request callback.
    // #
    // # @example Set before_request.
    // #   request.before_request { |request| p "yay" }
    // #
    // # @param [ Block ] block The block to execute.
    // #
    // # @yield [ Typhoeus::Request ]
    // #
    // # @return [ Array<Block> ] All before_request blocks.
    add_before_request(block) {
        this.before_request = this.before_request ? this.before_request : [];
        if (block) {
            this.before_request.push(block);
        }
        return this.before_request;
    }
    load_internal_cache() {
        return this.load_cache('internal');
    }
    load_external_cache() {
        return this.load_cache('external');
    }
    format_checks_list(checks) {
        return checks.map(x => x.name).join(', ');
    }
    load_cache(cacheType) {
        // todo
    }
}
