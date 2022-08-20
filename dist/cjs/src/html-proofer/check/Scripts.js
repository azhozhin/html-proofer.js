"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scripts = void 0;
const Check_1 = require("../Check");
const Utils_1 = require("../Utils");
class Scripts extends Check_1.Check {
    run() {
        this.html.css('script').each((i, node) => {
            const script = this.create_element(node);
            if (script.ignore()) {
                return;
            }
            if (!(0, Utils_1.isNullOrEmpty)(script.content.trim())) {
                return;
            }
            //# does the script exist?
            if (this.missing_src(script)) {
                this.add_failure('script is empty and has no src attribute', script.line, null, script.content);
            }
            else if (script.url.remote()) {
                this.add_to_external_urls(script.src, script.line);
                if (this.runner.check_sri()) {
                    this.check_sri(script);
                }
            }
            else if (!script.url.exists()) {
                this.add_failure(`internal script reference ${script.src} does not exist`, script.line, null, script.content);
            }
        });
        return this.external_urls;
    }
    missing_src(script) {
        return script.node['src'] == undefined;
    }
    check_sri(script) {
        if ((0, Utils_1.isNullOrEmpty)(script.node['integrity']) && (0, Utils_1.isNullOrEmpty)(script.node['crossorigin'])) {
            this.add_failure(`SRI and CORS not provided in: #{@script.url.raw_attribute}`, script.line, null, script.content);
        }
        else if ((0, Utils_1.isNullOrEmpty)(script.node['integrity'])) {
            this.add_failure(`Integrity is missing in: #{@script.url.raw_attribute}`, script.line, null, script.content);
        }
        else if ((0, Utils_1.isNullOrEmpty)(script.node['crossorigin'])) {
            this.add_failure(`CORS not provided for external resource in: #{@script.url.raw_attribute}`, script.line, null, script.content);
        }
    }
}
exports.Scripts = Scripts;
