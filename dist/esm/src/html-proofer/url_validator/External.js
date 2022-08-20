var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { UrlValidator } from '../UrlValidator';
import { Url } from '../attribute/Url';
import { Hydra } from '../Hydra';
import { createDocument, unique } from '../Utils';
import { Failure } from '../Failure';
import { outdent } from 'outdent';
export class External extends UrlValidator {
    constructor(runner, external_urls) {
        super(runner);
        this.paths_with_queries = new Map();
        this.external_urls = external_urls;
        this.before_request = [];
        this.hydra = new Hydra(runner.logger);
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cache.enabled()) {
                const urls_to_check = this.runner.load_external_cache();
                yield this.run_external_link_checker(urls_to_check);
            }
            else {
                yield this.run_external_link_checker(this.external_urls);
            }
            return this.failed_checks;
        });
    }
    // Proofer runs faster if we pull out all the external URLs and run the checks
    // at the end. Otherwise, we're halting the consuming process for every file during
    // `process_files`.
    //
    // In addition, sorting the list lets libcurl keep connections to the same hosts alive.
    //
    // Finally, we'll first make a HEAD request, rather than GETing all the contents.
    // If the HEAD fails, we'll fall back to GET, as some servers are not configured
    // for HEAD. If we've decided to check for hashes, we must do a GET--HEAD is
    // not available as an option.
    run_external_link_checker(links) {
        return __awaiter(this, void 0, void 0, function* () {
            //  Route log from Typhoeus/Ethon to our own logger
            //Ethon.logger = @logger
            for (const [external_url, metadata] of links) {
                const url = new Url(this.runner, external_url);
                if (!url.valid()) {
                    this.add_failure(metadata, `${url} is an invalid URL`, '0');
                    continue;
                }
                if (!this.new_url_query_values(url)) {
                    continue;
                }
                const method = this.runner.options['check_external_hash'] && url.is_hash() ? 'get' : 'head';
                this.queue_request(method, url, metadata);
            }
            yield this.hydra.run();
        });
    }
    queue_request(method, url, filenames) {
        const options = Object.assign({}, this.runner.options['typhoeus'], { method: method });
        const request = {
            url: url.url,
            options: options,
            maxRedirects: 5,
            on_complete: (response) => this.response_handler(response, url, filenames),
            on_error: (error) => this.failure_handler(error, url, filenames),
            base_url: () => new URL(url.url).origin,
        };
        for (const callback of this.before_request) {
            callback(request);
        }
        this.hydra.queue(request);
    }
    failure_handler(error, url, filenames) {
        const href = url.url;
        if (error.message.startsWith('timeout')) {
            this.handle_timeout(href, filenames, error.code);
        }
        else {
            this.handle_connection_failure(href, filenames, error.code, error.message);
        }
    }
    response_handler(response, url, filenames) {
        var _a;
        const method = response.request.method.toLowerCase();
        // const href = response.request.base_url.toString()
        const href = url.url;
        const response_code = response.status;
        response.data = response.data.replace('\x00', '');
        this.logger.log('debug', `Received a ${response_code} for ${href}`);
        if ((_a = this.runner.options['ignore_status_codes']) === null || _a === void 0 ? void 0 : _a.includes(response_code)) {
            return;
        }
        if (response_code >= 200 && response_code <= 299) {
            if (!this.check_hash_in_2xx_response(href, url, response, filenames)) {
                this.cache.add_external(href, filenames, response_code, 'OK');
            }
            // } else if (false/* todo: response_code.zero()*/) {
            //   this.handle_connection_failure(href, filenames, response_code, response.status_message);
        }
        else if (method === 'head') { //# some servers don't support HEAD
            this.queue_request('get', url, filenames);
        }
        else {
            if (this.runner.options['only_4xx'] && !(response_code >= 400 && response_code <= 499)) {
                return;
            }
            //# Received a non-successful http response.
            const status_message = (response.statusText) ? `: ${response.statusText}` : '';
            const msg = `External link ${href} failed${status_message}`;
            this.add_failure(filenames, msg, response_code);
            this.cache.add_external(href, filenames, response_code, msg);
        }
    }
    handle_timeout(href, filenames, response_code) {
        const msg = `External link ${href} failed: got a time out (response code ${response_code})`;
        this.cache.add_external(href, filenames, 0, msg);
        if (this.runner.options['only_4xx']) {
            return;
        }
        this.add_failure(filenames, msg, response_code);
    }
    //  Even though the response was a success, we may have been asked to check
    //  if the hash on the URL exists on the page
    check_hash_in_2xx_response(href, url, response, filenames) {
        if (this.runner.options['only_4xx']) {
            return false;
        }
        if (!this.runner.options['check_external_hash']) {
            return false;
        }
        if (!url.is_hash()) {
            return false;
        }
        const hash = url.hash;
        const doc = createDocument(response.data);
        const unencoded_hash = decodeURI(hash);
        const cssSelectors = [
            `[name="${hash}"]`,
            `[name="${unencoded_hash}"]`,
            `[id="${hash}"]`,
            `[id="${unencoded_hash}"]`,
        ];
        //# user-content is a special addition by GitHub.
        if (url.host.match(/github\.com/i)) {
            cssSelectors.push(`[name="user-content-${hash}"]`);
            cssSelectors.push(`[id="user-content-${hash}"]`);
            // when linking to a file on GitHub, like #L12-L34, only the first "L" portion
            // will be identified as a linkable portion
            const match = hash.match(/^(L\d)+/);
            if (match) {
                cssSelectors.push(`[id="${match[0]}"]`);
            }
        }
        // some (encoded and decoded) selectors could match thus do need to query twice
        const full_selector = unique(cssSelectors).join(',');
        if (doc.css(full_selector).length > 0) {
            return;
        }
        const msg = `External link ${href} failed: ${url.sans_hash()} exists, but the hash '${hash}' does not`;
        this.add_failure(filenames, msg, response.status);
        this.cache.add_external(href, filenames, response.status, msg);
        return true;
    }
    handle_connection_failure(href, metadata, response_code, status_message) {
        const msgs = [outdent `
      External link ${href} failed with something very wrong.
      It's possible libcurl couldn't connect to the server, or perhaps the request timed out.
      Sometimes, making too many requests at once also breaks things.
      `, ``];
        if (status_message) {
            msgs.push(`Either way, the return message from the server is: ${status_message}`);
        }
        const msg = msgs.join('\n').trim();
        this.cache.add_external(href, metadata, 0, msg);
        if (this.runner.options['only_4xx']) {
            return;
        }
        this.add_failure(metadata, msg, response_code);
    }
    add_failure(metadata, description, status = null) {
        if (metadata.length === 0) { // possible if we're checking an array of links
            this.failed_checks.push(new Failure('', 'Links > External', description, null, status));
        }
        for (const m of metadata) {
            this.failed_checks.push(new Failure(m.filename, 'Links > External', description, m.line, status));
        }
    }
    new_url_query_values(url) {
        var _a;
        if (url.query_values == null || Object.keys(url.query_values).length === 0) {
            return true;
        }
        const query_values = url.query_values;
        const queries = Object.keys(query_values).join('-');
        const domain_path = url.domain_path;
        if (!this.paths_with_queries.has(domain_path)) {
            this.paths_with_queries.set(domain_path, [queries]);
            return true;
        }
        else if (!((_a = this.paths_with_queries.get(domain_path)) === null || _a === void 0 ? void 0 : _a.includes(queries))) {
            this.paths_with_queries.get(domain_path).push(queries);
            return true;
        }
        return false;
    }
}
