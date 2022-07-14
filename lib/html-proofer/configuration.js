import {Links} from "./check/links";
import {Scripts} from "./check/scripts";
import {Images} from "./check/images";

export class Configuration {

    static DEFAULT_TESTS = [Links, Images, Scripts]

    static PROOFER_DEFAULTS = {
        allow_hash_href: true,
        allow_missing_href: false,
        assume_extension: ".html",
        check_external_hash: true,
        checks: this.DEFAULT_TESTS,
        directory_index_file: "index.html",
        disable_external: false,
        ignore_empty_alt: true,
        ignore_empty_mailto: false,
        ignore_files: [],
        ignore_missing_alt: false,
        ignore_status_codes: [],
        ignore_urls: [],
        enforce_https: true,
        extensions: [".html"],
        log_level: 'info',
        only_4xx: false,
        swap_attributes: {},
        swap_urls: {},
    }

    static PARALLEL_DEFAULTS = {
        enable: false,
    }

    static CACHE_DEFAULTS = {}

    static generate_defaults(opts) {
        const options = Object.assign({}, this.PROOFER_DEFAULTS, opts)
        options['parallel'] = Object.assign({}, this.PARALLEL_DEFAULTS, opts['parallel'] || {})
        options['cache'] = Object.assign({}, this.CACHE_DEFAULTS, opts['cache'] || {})

        delete options['src']
        return options
    }
}