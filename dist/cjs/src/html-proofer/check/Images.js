"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Images = void 0;
const Check_1 = require("../Check");
const Url_1 = require("../attribute/Url");
const Utils_1 = require("../Utils");
class Images extends Check_1.Check {
    constructor() {
        super(...arguments);
        this.SCREEN_SHOT_REGEX = /Screen(?: |%20)Shot(?: |%20)\d+-\d+-\d+(?: |%20)at(?: |%20)\d+.\d+.\d+/;
    }
    run() {
        for (const node of this.html.css('img')) {
            let img = this.create_element(node);
            if (img.ignore()) {
                continue;
            }
            // screenshot filenames should return because of terrible names
            if (this.terrible_filename(img)) {
                this.add_failure(`image has a terrible filename (${img.url.raw_attribute})`, img.line, null, img.content);
            }
            // does the image exist?
            if (this.missing_src(img)) {
                this.add_failure('image has no src or srcset attribute', img.line, null, img.content);
            }
            else if (img.url.remote()) {
                this.add_to_external_urls(img.url, img.line);
            }
            else if (!img.url.exists() && !img.multiple_srcsets()) {
                this.add_failure(`internal image ${img.url.raw_attribute} does not exist`, img.line, null, img.content);
            }
            else if (img.multiple_srcsets()) {
                const srcsets = img.srcset.split(',').map((x) => x.trim());
                for (const srcset of srcsets) {
                    const srcset_url = new Url_1.Url(this.runner, srcset, img.base_url);
                    if (srcset_url.remote()) {
                        this.add_to_external_urls(srcset_url, img.line);
                    }
                    else if (!srcset_url.exists()) {
                        this.add_failure(`internal image ${srcset} does not exist`, img.line, null, img.content);
                    }
                }
            }
            if (!this.ignore_element(img)) {
                if (this.missing_alt_tag(img) && !this.ignore_missing_alt()) {
                    this.add_failure(`image ${img.url.raw_attribute} does not have an alt attribute`, img.line, null, img.content);
                }
                else if ((this.empty_alt_tag(img) || this.alt_all_spaces(img)) && !this.ignore_empty_alt()) {
                    this.add_failure(`image ${img.url.raw_attribute} has an alt attribute, but no content`, img.line, null, img.content);
                }
            }
            if (this.runner.enforce_https() && img.url.http()) {
                this.add_failure(`image ${img.url.raw_attribute} uses the http scheme`, img.line, null, img.content);
            }
        }
        return {
            external_urls: this.external_urls,
            internal_urls: this.internal_urls,
            failures: this.failures
        };
    }
    ignore_missing_alt() {
        return this.runner.options['ignore_missing_alt'] || false;
    }
    ignore_empty_alt() {
        return this.runner.options['ignore_empty_alt'] || false;
    }
    ignore_element(img) {
        return img.url.ignore() || img.aria_hidden();
    }
    missing_alt_tag(img) {
        return img.node.attributes['alt'] == null;
    }
    empty_alt_tag(img) {
        return !this.missing_alt_tag(img) && img.node.attributes['alt'] === '';
    }
    alt_all_spaces(img) {
        return !this.missing_alt_tag(img) && img.node.attributes['alt'].trim() === '';
    }
    terrible_filename(img) {
        const u = img.url.toString();
        return u ? u.match(this.SCREEN_SHOT_REGEX) != null : false;
    }
    missing_src(img) {
        return (0, Utils_1.isNullOrEmpty)(img.url.toString());
    }
}
exports.Images = Images;
