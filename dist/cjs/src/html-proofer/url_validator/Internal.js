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
exports.Internal = void 0;
const UrlValidator_1 = require("../UrlValidator");
const Failure_1 = require("../Failure");
const fs = __importStar(require("fs"));
const Utils_1 = require("../Utils");
const Url_1 = require("../attribute/Url");
class Internal extends UrlValidator_1.UrlValidator {
    constructor(runner, internal_urls) {
        super(runner);
        this.internal_urls = internal_urls;
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            // if (this.cache.enabled) {
            //   const urls_to_check = this.runner.load_internal_cache()
            //   this.run_internal_link_checker(urls_to_check)
            // } else {
            this.run_internal_link_checker(this.internal_urls);
            // }
            return this.failed_checks;
        });
    }
    run_internal_link_checker(links) {
        const to_add = [];
        for (const [link, matched_files] of links) {
            for (const metadata of matched_files) {
                const url = new Url_1.Url(this.runner, link, metadata.base_url);
                this.runner.current_source = metadata.source;
                this.runner.current_filename = metadata.filename;
                if (!this.file_exists(url)) {
                    this.failed_checks.push(new Failure_1.Failure(metadata.filename, 'Links > Internal', `internally linking to ${url}, which does not exist`, metadata.line, null, null));
                    to_add.push([url, metadata, false]);
                    continue;
                }
                if (!this.hash_exists(url)) {
                    this.failed_checks.push(new Failure_1.Failure(metadata.filename, 'Links > Internal', `internally linking to ${url}; the file exists, but the hash '${url.hash}' does not`, metadata['line'], null, null));
                    to_add.push([url, metadata, false]);
                    continue;
                }
                to_add.push([url, metadata, true]);
            }
        }
        // adding directly to the cache above results in an endless loop
        for (const [url, metadata, exists] of to_add) {
            this.cache.add_internal(url.toString(), metadata, exists);
        }
        return this.failed_checks;
    }
    file_exists(url) {
        const absolute_path = url.absolute_path;
        if (this.runner.checked_paths.has(absolute_path)) {
            return this.runner.checked_paths.get(url.absolute_path);
        }
        const checkResult = fs.existsSync(absolute_path);
        this.runner.checked_paths.set(url.absolute_path, checkResult);
        return checkResult;
    }
    //verify the target hash
    hash_exists(url) {
        const href_hash = url.hash;
        if (!href_hash) {
            return true;
        }
        // prevents searching files we didn't ask about
        if (!url.known_extension()) {
            return false;
        }
        const decoded_href_hash = decodeURI(href_hash);
        const fragment_ids = (0, Utils_1.unique)([href_hash, decoded_href_hash]);
        // https://www.w3.org/TR/html5/single-page.html#scroll-to-fragid
        const absolute_path = url.absolute_path;
        const cache_key = fragment_ids.join(':');
        if (this.runner.checked_hashes.has(absolute_path)) {
            const hashes = this.runner.checked_hashes.get(absolute_path);
            if (hashes.has(cache_key)) {
                return hashes.get(cache_key);
            }
        }
        else {
            this.runner.checked_hashes.set(absolute_path, new Map());
        }
        const hash_exists = fragment_ids.includes('top') || this.find_fragments(fragment_ids, url).length > 0;
        this.runner.checked_hashes.get(absolute_path).set(cache_key, hash_exists);
        return hash_exists;
    }
    find_fragments(fragment_ids, url) {
        const csss = fragment_ids.flatMap(frag_id => {
            const escaped_frag_id = `${frag_id}`.replaceAll('"', '\\\"');
            return [
                `[id = "${escaped_frag_id}"]`,
                `[name = "${escaped_frag_id}"]`
            ];
        });
        const html = (0, Utils_1.create_nokogiri)(url.absolute_path);
        return html.css(csss.join(','));
    }
}
exports.Internal = Internal;
