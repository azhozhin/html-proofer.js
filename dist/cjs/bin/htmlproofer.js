#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const Version_1 = require("../src/html-proofer/Version");
const Utils_1 = require("../src/html-proofer/Utils");
const html_proofer_1 = require("../src/html-proofer");
const Checks_1 = require("../src/html-proofer/Checks");
const Configuration_1 = require("../src/html-proofer/Configuration");
const IOptions_1 = require("../src/interfaces/IOptions");
commander_1.program.
    version(Version_1.VERSION).
    description(`Test your rendered HTML files to make sure they're accurate.\n` +
    `Runs the HTML-Proofer suite on the files in PATH. For more details, see the README.`).
    option('--allow-hash-href [bool]', 'If `true`, assumes `href="#"` anchors are valid', true).
    option('--allow-missing-href [bool]', 'If `true`, does not flag `a` tags missing `href`. In HTML5, this is technically allowed, but could also be human error.', false).
    option('--as-links [links]', 'Assumes that `PATH` is a comma-separated array of links to check.', false).
    option('--assume-extension [ext]', 'Automatically add specified extension to files for internal links, to allow extensionless URLs (as supported by most servers) (default: `.html`).', '.html').
    option('--checks [checks]', 'A comma-separated list of Strings indicating which checks you want to run (default: \'Links,Images,Scripts\')', 'Links,Images,Scripts').
    option('--check-external-hash [bool]', 'Checks whether external hashes exist (even if the webpage exists) (default: `true`).', true).
    option('--check-sri [bool]', 'Check that "<link>" and "<script>" external resources use SRI (default: "false").', false).
    option('--directory-index-file [directory-index-file]', 'Sets the file to look for when a link refers to a directory. (default: `index.html`)', 'index.html').
    option('--disable-external', 'If `true`, does not run the external link checker (default: `false`)', false).
    option('--enforce-https [bool]', 'Fails a link if it\'s not marked as `https` (default: `true`).', true).
    option('--extensions [extensions]', 'A comma-separated list of Strings indicating the file extensions you would like to check (including the dot)', ['.html']).
    option('--ignore-empty-alt [bool]', 'If `true`, ignores images with empty/missing alt tags (in other words, `<img alt>` and `<img alt="">` are valid; set this to `false` to flag those)', true).
    option('--ignore-files [ignore-files]', 'A comma-separated list of Strings or RegExps containing file paths that are safe to ignore', '').
    option('--ignore-empty-mailto [bool]', 'If `true`, allows `mailto:` `href`s which do not contain an email address', false).
    option('--ignore-missing-alt [bool]', 'If `true`, ignores images with missing alt tags', false).
    option('--ignore-status-codes [ignore-status-codes]', 'A comma-separated list of numbers representing status codes to ignore.', '').
    option('--ignore-urls [ignore-urls]', 'A comma-separated list of Strings or RegExps containing URLs that are safe to ignore. This affects all HTML attributes, such as `alt` tags on images.', '').
    option('--log-level [level]', 'Sets the logging level. One of `debug`, `info`, `warn`, or `error`', 'info').
    option('--only-4xx [bool]', 'Only reports errors for links that fall within the 4xx status code range', false).
    option('--root-dir [root-dir]', 'The absolute path to the directory serving your html-files.', '').
    option('--swap-attributes [config]', 'JSON-formatted config that maps element names to the preferred attribute to check.').
    option('--swap-urls [swap-urls]', 'A comma-separated list containing key-value pairs of `RegExp => String`. It transforms URLs that match `RegExp` into `String` via `gsub`. The escape sequences `\\:` should be used to produce literal `:`s.').
    option('--typhoeus [config]', 'JSON-formatted string of Typhoeus config. Will override the html-proofer defaults.').
    option('--hydra [config]', 'JSON-formatted string of Hydra config. Will override the html-proofer defaults.').
    option('--parallel [config]', 'JSON-formatted string of Parallel config. Will override the html-proofer defaults.').
    option('--cache [config]', 'JSON-formatted string of cache config. Will override the html-proofer defaults.').
    command('scan [path]', { isDefault: true }).
    action(() => __awaiter(void 0, void 0, void 0, function* () {
    const opts = commander_1.program.opts();
    const path = commander_1.program.args.length === 0 ? '.' : commander_1.program.args[0];
    //console.debug(opts)
    const options = IOptions_1.EmptyOptions;
    const checks = [];
    if (opts.checks) {
        let checks_str = opts.checks;
        for (const checkName of checks_str.split(',')) {
            if (Checks_1.AllChecks[checkName] == null) {
                throw new Error(`Unknown check ${checkName}`);
            }
            checks.push(Checks_1.AllChecks[checkName]);
        }
        options['checks'] = checks;
    }
    if (opts.allowHashHref != null) {
        options['allow_hash_href'] = opts.allowHashHref;
    }
    if (opts.allowMissingHref != null) {
        options['allow_missing_href'] = opts.allowMissingHref;
    }
    if (opts.assumeExtension != null) {
        options['assume_extension'] = opts.assumeExtension;
    }
    if (opts.checkExternalHash != null) {
        options['check_external_hash'] = opts.checkExternalHash;
    }
    if (opts.ignoreEmptyAlt != null) {
        options['ignore_empty_alt'] = opts.ignoreEmptyAlt;
    }
    if (opts.ignoreEmptyMailto != null) {
        options['ignore_empty_mailto'] = opts.ignoreEmptyMailto;
    }
    if (opts.ignoreMissingAlt != null) {
        options['ignore_missing_alt'] = opts.ignoreMissingAlt;
    }
    if (opts.extensions) {
        if (opts.extensions.constructor.name === 'String') {
            options['extensions'] = opts.extensions.split(',');
        }
    }
    if (opts.directoryIndexFile) {
        options['directory_index_file'] = opts.directoryIndexFile;
    }
    if (opts.disableExternal != null) {
        options['disable_external'] = opts.disableExternal;
    }
    if (opts.ignoreFiles) {
        options['ignore_files'] = opts.ignoreFiles.split(',');
    }
    if (opts.ignoreUrls) {
        options['ignore_urls'] = opts.ignoreUrls.split(',').
            map((e) => (e.startsWith('/') && e.endsWith('/')) ? new RegExp(e.slice(1, -1)) : e);
    }
    if (opts.ignoreStatusCodes) {
        options['ignore_status_codes'] = opts.ignoreStatusCodes.split(',');
    }
    if (opts.only4xx != null) {
        options['only_4xx'] = opts.only4xx;
    }
    if (opts.swapAttributes) {
        options['swap_attributes'] = Configuration_1.Configuration.parse_json_option('swap_attributes', opts.swapAttributes);
    }
    if (opts.typhoeus) {
        options['typhoeus'] = Configuration_1.Configuration.parse_json_option('typhoeus', opts.typhoeus);
    }
    if (opts.swapUrls) {
        const map = new Map();
        for (const i of opts.swapUrls.split(',')) {
            const sp = i.split(/(?<!\\):/, 2);
            const re = sp[0].replaceAll(/\\:/g, ':');
            map.set(re, sp[1].replaceAll(/\\:/g, ':'));
        }
        options['swap_urls'] = map;
    }
    if (opts.rootDir) {
        options['root_dir'] = opts.rootDir;
    }
    if (opts.enforceHttps != null) {
        options['enforce_https'] = opts.enforceHttps;
    }
    if (opts.logLevel) {
        options['log_level'] = opts.logLevel;
    }
    const paths = path.split(',');
    if (opts.asLinks) {
        const links = opts.asLinks.split(',')
            .flatMap((e) => e.split(','))
            .map((e) => e.trim());
        yield html_proofer_1.HTMLProofer.check_links(links, options).run();
    }
    else if ((0, Utils_1.isDirectory)(paths[0])) {
        yield html_proofer_1.HTMLProofer.check_directories(paths, options).run();
    }
    else {
        yield html_proofer_1.HTMLProofer.check_file(path, options).run();
    }
}));
commander_1.program.parse(process.argv);