"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Check = void 0;
const Failure_1 = require("./Failure");
const Element_1 = require("./Element");
class Check {
    constructor(runner, html) {
        this.internal_urls = new Map();
        this.external_urls = new Map();
        this._base_url = null;
        this.runner = runner;
        this.html = this.removeIgnoredTags(html);
        this.failures = [];
    }
    create_element(node) {
        return new Element_1.Element(this.runner, this.html, node, this.base_url());
    }
    add_failure(description, line = null, status = null, content = null) {
        this.failures.push(new Failure_1.Failure(this.runner.current_filename, this.name, description, line, status, content));
    }
    removeIgnoredTags(html) {
        for (const node of html.css("code, pre, tt")) {
            html.remove(node);
        }
        return html;
    }
    get name() {
        return this.constructor.name;
    }
    add_to_internal_urls(url, line) {
        const url_string = url.raw_attribute || '';
        if (!this.internal_urls.has(url_string)) {
            this.internal_urls.set(url_string, []);
        }
        const metadata = {
            source: this.runner.current_source,
            filename: this.runner.current_filename,
            line: line,
            base_url: this.base_url(),
            found: false,
        };
        this.internal_urls.get(url_string).push(metadata);
    }
    add_to_external_urls(url, line) {
        const url_string = url.toString();
        if (!this.external_urls.has(url_string)) {
            this.external_urls.set(url_string, []);
        }
        this.external_urls.get(url_string).push({
            filename: this.runner.current_filename,
            line: line,
        });
    }
    base_url() {
        if (this._base_url) {
            return this._base_url;
        }
        const base = this.html.css('base');
        if (base && base.length == 0) {
            this._base_url = null;
            return null;
        }
        const node = base[0];
        this._base_url = node.attributes['href'];
        return this._base_url;
    }
}
exports.Check = Check;
