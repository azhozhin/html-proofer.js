"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Favicon = void 0;
const Check_1 = require("../Check");
const Utils_1 = require("../Utils");
class Favicon extends Check_1.Check {
    run() {
        let found = false;
        let el = null;
        for (const node of this.html.css('link')) {
            el = this.create_element(node);
            if (el.ignore()) {
                continue;
            }
            found = (0, Utils_1.last)(el.node.attributes['rel'].split(' ')) === 'icon';
            if (found) {
                break;
            }
        }
        if (this.immediate_redirect()) {
            // do nothing
        }
        else {
            if (found) {
                if (el.url.remote()) {
                    this.add_to_external_urls(el.url, el.line);
                }
                else if (!el.url.exists()) {
                    this.add_failure(`internal favicon ${el.url.raw_attribute} does not exist`, el.line, null, el.content);
                }
            }
            else {
                this.add_failure('no favicon provided');
            }
        }
        return {
            external_urls: this.external_urls,
            internal_urls: this.internal_urls,
            failures: this.failures
        };
    }
    // allow any instant-redirect meta tag
    immediate_redirect() {
        const content = this.html.css('meta[http-equiv="refresh"]');
        if (!content || content.length === 0) {
            return false;
        }
        // todo: inconsistent API
        return content[0].attributes['content'].startsWith('0;');
    }
}
exports.Favicon = Favicon;
