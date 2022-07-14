import {Failure} from "./failure"
import * as path from "path"
import glob from "glob"
import {Cli} from "./reporter/cli";
import {create_nokogiri, pluralize} from "./utils";
import {Check} from "./check";
import {all_checks} from "./checks";
import {External} from "./url_validator/external";
import {Internal} from "./url_validator/internal";
import {Url} from "./attribute/url";

export class Runner {
    source
    cache
    logger
    internal_urls
    external_urls
    checked_paths
    current_check

    current_filename
    current_source
    reporter

    URL_TYPES = Array.from(['external', 'internal'])

    constructor(src, opts = {}) {
        this.options = opts // todo
        this.options['extensions'] = [".html"]
        this.options['ignore_files'] = []
        this.options['ignore_urls'] = []
        this.options['disable_external'] = true

        this.type = this.options['type']
        delete this.options['type']
        this.source = src

        this.logger = console

        this.external_urls = {}
        this.internal_urls = {}
        this.failures = []

        this.before_request = []
        this.checked_paths = {}

        this.current_check = null
        this.current_source = null
        this.current_filename = null

        this.reporter = new Cli(this.logger)
    }

    run() {
        const check_text = pluralize(this.checks.length, "check", "checks")

        if (this.type == 'links') {
            this.logger.log('info', `Running ${check_text} (${this.format_checks_list(this.checks)}) on #{@source} ... \n\n`)
            if (!this.options['disable_external']) {
                this.check_list_of_links()
            }
        } else {
            this.logger.log('info',
                `Running ${check_text} (${this.format_checks_list(this.checks)}) in ${this.source} on *${this.options['extensions'].join(", ")} files...\n\n`)
            this.check_files()
            this.logger.log('info', `Ran on ${pluralize(this.files.length, "file", "files")}!\n\n`)
        }

        //this.cache.write()

        this.reporter.failures = this.failures

        if (this.failures.length == 0) {
            this.logger.log('info', "HTML-Proofer finished successfully.")
        } else {
            //@failures.uniq!
            this.report_failed_checks()
        }
    }

    check_list_of_links() {
        this.external_urls = this.source.forEach((link, hash) => {
            const url = new Url(this, link, null).toString()

            hash[url] = []
        })

        this.validate_external_urls()
    }

    // Walks over each implemented check and runs them on the files, in parallel.
    // Sends the collected external URLs to Typhoeus for batch processing.
    check_files() {
        this.process_files.forEach((result) => {
            const that = this
            // todo: this is too complicated
            this.URL_TYPES.forEach((url_type) => {
                const type = `${url_type}_urls`
                const ivar_name = `${type}`
                const a = that
                const ivar = that[ivar_name]

                if (ivar == null) {
                    instance_variable_set(ivar_name, result[type])
                } else {
                    for (const [url, metadata] of Object.entries(result[type])) {
                        if (ivar[url] == null) {
                            ivar[url] = []
                        }
                        ivar[url].extend(metadata)
                    }
                }
            })
            this.failures.extend(result.failures)
        })

        if (!this.options['disable_external']) {
            this.validate_external_urls()
        }

        this.validate_internal_urls()
    }

    get process_files() {
        // todo: this is partial implementation
        const result = this.files.map(file => this.load_file(file.path, file.source))
        return result
    }

    load_file(path, source) {
        this.html = create_nokogiri(path)
        return this.check_parsed(path, source)
    }

    // Collects any external URLs found in a directory of files. Also collectes
    // every failed test from process_files.
    check_parsed(path, source) {
        const result = {internal_urls: {}, external_urls: {}, failures: []}

        this.checks.forEach(klass => {
            this.current_source = source
            this.current_filename = path

            const check = new all_checks[klass](this, this.html)
            this.logger.log('debug', `Running ${check.short_name} in ${path}`)

            this.current_check = check

            check.run()

            //result['external_urls'].merge(check.external_urls) { |_key, old, current| old.concat(current) }
            for (const [k, v] of Object.entries(check.external_urls)) {
                if (!result.external_urls[k]) {
                    result.external_urls[k] = []
                }
                result.external_urls[k].extend(v)
            }
            //result['internal_urls'].merge(check.internal_urls) { |_key, old, current| old.concat(current) }
            for (const [k, v] of Object.entries(check.internal_urls)) {
                if (!result.internal_urls[k]) {
                    result.internal_urls[k] = []
                }
                result.internal_urls[k].extend(v)
            }
            result.failures.extend(check.failures)
        })
        return result
    }

    validate_external_urls() {
        const external_url_validator = new External(this, this.external_urls)
        //external_url_validator.before_request = @before_request
        const validated = external_url_validator.validate()
        this.failures.extend(validated)
    }

    validate_internal_urls() {
        const internal_link_validator = new Internal(this, this.internal_urls)
        const validated = internal_link_validator.validate()
        this.failures.extend(validated)
    }

    get files() {
        // if (this._files){
        //     return this._files
        // }
        // todo:
        this._files = []
        if (this.type == 'directory') {
            const pattern = path.join(this.source, "**", `*{${this.options['extensions'].join(",")}}`)
            let found_files = []
            glob(pattern, (err, files) => {
                found_files = files
            })
            this._files = found_files
                .filter(f => path.existsSync(f) && !this.ignore_file(f))
                .map(f => ({source: src, path: f}))

        } else if (this.type == 'file' && this.options['extensions'].includes(path.extname(this.source))) {
            this._files = [this.source]
                .filter(f => !this.ignore_file(f))
                .map(f => ({source: f, path: f}))
        }
        return this._files
    }

    ignore_file(file) {
        this.options['ignore_files'].forEach(pattern => {
            if (typeof pattern == 'string' && pattern == file) {
                return true
            }
            if (typeof pattern == 'RegExp' && pattern.matches(file)) {
                return true
            }
        })
        return false
    }

    check_sri() {
        return this.options['check_sri']
    }

    enforce_https() {
        return this.options['enforce_https']
    }

    get checks() {
        if (this._checks) {
            return this._checks
        }
        if (this.type == 'links') {
            this._checks = ["LinkCheck"]
            return this._checks
        }

        this._checks = new Check().subchecks(this.options).map(x => x.name)

        return this._checks
    }

    get failed_checks() {
        const result = this.reporter.failures.filter(f => f.constructor.name == 'Failure')
        return result
        // todo
        // return [new Failure(null, null, "internally linking to ../images/missing_image_alt.html#asdfasfdkafl; the file exists, but the hash 'asdfasfdkafl' does not")]
    }

    report_failed_checks() {
        this.reporter.report()

        const failure_text = pluralize(this.failures.length, "failure", "failures")
        this.logger.log('fatal', `\nHTML-Proofer found ${failure_text}!`)
        //throw new Error('')
    }

    end

    get external_urls() {
        // todo
        return []
    }

    format_checks_list(checks) {
        return checks.map(x => x).join(', ')
    }

}