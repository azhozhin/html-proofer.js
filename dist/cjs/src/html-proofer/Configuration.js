"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configuration = void 0;
const Links_1 = require("./check/Links");
const Scripts_1 = require("./check/Scripts");
const Images_1 = require("./check/Images");
const Version_1 = require("./Version");
const Utils_1 = require("./Utils");
const CheckType_1 = require("./CheckType");
class Configuration {
    static generate_defaults(opts) {
        const options = Object.assign({}, this.PROOFER_DEFAULTS, opts);
        options['typhoeus'] = Object.assign({}, this.TYPHOEUS_DEFAULTS, (opts || {})['typhoeus']);
        options['hydra'] = Object.assign({}, this.HYDRA_DEFAULTS, (opts || {})['hydra']);
        options['parallel'] = Object.assign({}, this.PARALLEL_DEFAULTS, (opts || {})['parallel']);
        options['cache'] = Object.assign({}, this.CACHE_DEFAULTS, (opts || {})['cache']);
        return options;
    }
    static parse_json_option(option_name, config, symbolize_names = true) {
        if (option_name != null && option_name.constructor.name !== 'String') {
            throw new Error('ArgumentError: Must provide an option name in string format.');
        }
        if (option_name != null && (0, Utils_1.isNullOrEmpty)(option_name.trim())) {
            throw new Error('ArgumentError: Must provide an option name in string format.');
        }
        if (config != null && config.constructor.name !== 'String') {
            throw new Error('ArgumentError: Must provide a JSON configuration in string format.');
        }
        if (config == null || (0, Utils_1.isNullOrEmpty)(config.trim())) {
            return {};
        }
        try {
            return JSON.parse(config.replaceAll('\'', '"'));
        }
        catch (err) {
            throw new Error(`ArgumentError: Option '${option_name}' did not contain valid JSON.`);
        }
    }
}
exports.Configuration = Configuration;
_a = Configuration;
Configuration.DEFAULT_TESTS = [Links_1.Links, Images_1.Images, Scripts_1.Scripts];
Configuration.PROOFER_DEFAULTS = {
    type: CheckType_1.CheckType.LINKS,
    allow_hash_href: true,
    allow_missing_href: false,
    assume_extension: '.html',
    check_external_hash: true,
    checks: _a.DEFAULT_TESTS,
    directory_index_file: 'index.html',
    disable_external: false,
    ignore_empty_alt: true,
    ignore_empty_mailto: false,
    ignore_files: [],
    ignore_missing_alt: false,
    ignore_status_codes: [],
    ignore_urls: [],
    enforce_https: true,
    extensions: ['.html'],
    log_level: 'info',
    only_4xx: false,
    swap_attributes: {},
};
Configuration.TYPHOEUS_DEFAULTS = {
    followlocation: true,
    headers: {
        // todo: change github repo url
        'User-Agent': `Mozilla/5.0 (compatible; HTML Proofer/${Version_1.VERSION}; +https://github.com/gjtorikian/html-proofer)`,
        'Accept': 'application/xml,application/xhtml+xml,text/html;q=0.9, text/plain;q=0.8,image/png,*/*;q=0.5',
        //'Accept': '*/*',
    },
    connecttimeout: 10,
    timeout: 30, // todo: this option is not currently in use
};
Configuration.HYDRA_DEFAULTS = {
    max_concurrency: 50, // todo: this option is not currently in use
};
Configuration.PARALLEL_DEFAULTS = {
    enable: false, // todo: this option is not currently in use
};
Configuration.CACHE_DEFAULTS = {};
