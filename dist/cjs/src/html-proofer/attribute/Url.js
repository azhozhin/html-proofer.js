"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Url = void 0;
const Attribute_1 = require("../Attribute");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const urijs_1 = __importDefault(require("urijs"));
const Utils_1 = require("../Utils");
class Url extends Attribute_1.Attribute {
    constructor(runner, link_attribute, base_url = null) {
        super(runner, link_attribute);
        this.REMOTE_SCHEMES = Array.from(['http', 'https']);
        if (this.raw_attribute == null) {
            this.url = null;
        }
        else {
            this.url = this.raw_attribute.replace('\u200b', '').trim();
            if (base_url) {
                this.url = (0, Utils_1.joinUrl)(base_url, this.url);
            }
            this.url = this.swap_urls(this.url);
            this.url = this.clean_url(this.url);
            // convert "//" links to "https://"
            if (this.url.startsWith('//')) {
                this.url = `https:${this.url}`;
            }
        }
    }
    toString() {
        return this.url || '';
    }
    known_extension() {
        if (this.hash_link()) {
            return true;
        }
        const ext = path.extname(this.path);
        // no extension means we use the assumed one
        if (!ext) {
            return this.runner.options['extensions'].includes(this.runner.options['assume_extension']);
        }
        return this.runner.options['extensions'].includes(ext);
    }
    ignore() {
        if (this.url && this.url.match(/^javascript:/)) {
            return true;
        }
        if (this.ignores_pattern(this.runner.options['ignore_urls'])) {
            return true;
        }
    }
    sans_hash() {
        return this.url.toString().replace(`#${this.hash}`, '');
    }
    // catch any obvious issues, like strings in port numbers
    clean_url(url) {
        if (url.match(/^([!-;=?-\[\]_a-z~]|%[0-9a-fA-F]{2})+$/)) {
            return url;
        }
        if (this.url === '') {
            return url;
        }
        url = (0, urijs_1.default)(url).normalize().toString();
        return url;
    }
    swap_urls(url) {
        if (!this.runner.options['swap_urls']) {
            return url;
        }
        const replacements = this.runner.options['swap_urls'];
        for (const [link, replacement] of replacements) {
            // this is workaround for javascript as it is not possible to use RegExp as key for dictionary
            if (link.startsWith('/') && link.endsWith('/')) {
                const regex = new RegExp(link.replace(/^\//, '').replace(/\/$/, ''));
                url = url.replace(regex, replacement);
            }
            else {
                url = url.replace(link, replacement);
            }
        }
        return url;
    }
    ignores_pattern(links_to_ignore) {
        var _a;
        if (!(links_to_ignore.constructor.name === 'Array')) {
            return false;
        }
        for (const link_to_ignore of links_to_ignore) {
            switch (link_to_ignore.constructor.name) {
                case 'String':
                    if (link_to_ignore === this.raw_attribute) {
                        return true;
                    }
                    break;
                case 'RegExp':
                    if ((_a = this.raw_attribute) === null || _a === void 0 ? void 0 : _a.match(link_to_ignore)) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }
    valid() {
        return this.parts != null;
    }
    is_path() {
        return this.parts.host() != null && this.parts.path() != null;
    }
    get parts() {
        // todo: refactor this
        if (this._parts) {
            return this._parts;
        }
        try {
            this._parts = (0, urijs_1.default)(this.url);
        }
        catch (err) {
            this._parts = null;
        }
        return this._parts;
    }
    get path() {
        return this.parts != null ? decodeURI(this.parts.path()) : null;
    }
    get hash() {
        return this.parts ? this.parts.fragment() : null;
    }
    is_hash() {
        return !(0, Utils_1.isNullOrEmpty)(this.hash);
    }
    get scheme() {
        return this.parts ? this.parts.scheme() : null;
    }
    remote() {
        return this.REMOTE_SCHEMES.includes(this.scheme);
    }
    http() {
        return this.scheme === 'http';
    }
    https() {
        return this.scheme === 'https';
    }
    non_http_remote() {
        return !(0, Utils_1.isNullOrEmpty)(this.scheme) && !this.remote();
    }
    get host() {
        return this.parts ? this.parts.hostname() : null;
    }
    get domain_path() {
        return (this.host || '') + this.path;
    }
    get query_values() {
        return this.parts ? this.parts.query(true) : null;
    }
    exists() {
        if (this.base64()) {
            return true;
        }
        if (this.runner.checked_paths.has(this.absolute_path)) {
            return this.runner.checked_paths.get(this.absolute_path);
        }
        const checkResult = fs.existsSync(this.absolute_path);
        this.runner.checked_paths.set(this.absolute_path, checkResult);
        return checkResult;
    }
    base64() {
        return this.raw_attribute ? this.raw_attribute.match(/^data:image/) : false;
    }
    get absolute_path() {
        const current_path = this.file_path || this.runner.current_filename;
        return path.resolve(current_path);
    }
    get file_path() {
        if (this.path == null || this.path === '') {
            return null;
        }
        let path_dot_ext = '';
        if (this.runner.options['assume_extension']) {
            path_dot_ext = this.path + this.runner.options['assume_extension'];
        }
        let base;
        // path relative to root
        // todo: this is too complicated
        if (this.is_absolute_path(this.path)) {
            // either overwrite with root_dir; or, if source is directory, use that; or, just get the current file's dirname
            base = this.runner.options['root_dir'] ||
                ((0, Utils_1.isDirectory)(this.runner.current_source) ? this.runner.current_source : path.dirname(this.runner.current_source));
            //relative links, path is a file
        }
        else if (fs.existsSync(path.resolve(this.runner.current_source, this.path)) ||
            fs.existsSync(path.resolve(this.runner.current_source, path_dot_ext))) {
            base = path.dirname(this.runner.current_filename);
            // relative links in nested dir, path is a file
        }
        else if (fs.existsSync(path.join(path.dirname(this.runner.current_filename), this.path)) ||
            fs.existsSync(path.join(path.dirname(this.runner.current_filename), path_dot_ext))) {
            base = path.dirname(this.runner.current_filename);
            // relative link, path is a directory
        }
        else {
            base = this.runner.current_filename;
        }
        let file = path.join(base || '', this.path);
        if (this.runner.options['assume_extension'] && (0, Utils_1.isFile)(`${file}${this.runner.options['assume_extension']}`)) {
            file = `${file}${this.runner.options['assume_extension']}`;
        }
        else if ((0, Utils_1.isDirectory)(file) && !this.unslashed_directory(file)) { //# implicit index support
            file = path.join(file, this.runner.options['directory_index_file']);
        }
        return file;
    }
    unslashed_directory(file) {
        if (!(0, Utils_1.isDirectory)(file)) {
            return false;
        }
        return !file.endsWith(path.sep) && !this.follow_location();
    }
    follow_location() {
        return this.runner.options['typhoeus'] && this.runner.options['typhoeus']['followlocation'];
    }
    is_absolute_path(path) {
        return path.startsWith('/');
    }
    get external() {
        return !this.internal;
    }
    get internal() {
        return this.relative_link() || this.internal_absolute_link() || this.hash_link();
    }
    internal_absolute_link() {
        return this.url.startsWith('/');
    }
    relative_link() {
        if (this.remote()) {
            return false;
        }
        return this.hash_link() || this.param_link() || this.url.startsWith('.') || this.url.match(/^\S/) != null;
    }
    hash_link() {
        return this.url.startsWith('#');
    }
    param_link() {
        return this.url.startsWith('?');
    }
}
exports.Url = Url;
