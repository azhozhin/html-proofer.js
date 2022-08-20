"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenGraph = void 0;
const Check_1 = require("../Check");
class OpenGraph extends Check_1.Check {
    run() {
        this.html.css('meta[property="og:url"], meta[property="og:image"]').each((i, node) => {
            const openGraph = this.create_element(node);
            if (openGraph.ignore()) {
                return;
            }
            //does the openGraph exist?
            if (this.missing_content(openGraph)) {
                this.add_failure('open graph has no content attribute', openGraph.line, null, openGraph.content);
            }
            else if (this.empty_content(openGraph)) {
                this.add_failure('open graph content attribute is empty', openGraph.line, null, openGraph.content);
            }
            else if (!openGraph.url.valid()) {
                this.add_failure(`${openGraph.src} is an invalid URL`, openGraph.line);
            }
            else if (openGraph.url.remote()) {
                this.add_to_external_urls(openGraph.url, openGraph.line);
            }
            else {
                if (!openGraph.url.exists()) {
                    this.add_failure(`internal open graph ${openGraph.url.raw_attribute} does not exist`, openGraph.line, null, openGraph.content);
                }
            }
        });
        return this.external_urls;
    }
    missing_content(element) {
        return element.node['content'] == null;
    }
    empty_content(element) {
        return element.node['content'] === '';
    }
}
exports.OpenGraph = OpenGraph;
