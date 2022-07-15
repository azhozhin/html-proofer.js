import {Check} from "../check";
import {Url} from "../attribute/url";
import {isNullOrEmpty} from "../utils";

export class Images extends Check {
    SCREEN_SHOT_REGEX = /Screen(?: |%20)Shot(?: |%20)\d+-\d+-\d+(?: |%20)at(?: |%20)\d+.\d+.\d+/

    run() {
        this.html.css("img").each((i, node) => {
            this.img = this.create_element(node)

            if (this.img.ignore()) {
                return
            }

            // screenshot filenames should return because of terrible names
            if (this.terrible_filename()) {
                this.add_failure(`image has a terrible filename (${this.img.url.raw_attribute})`, this.img.line, null, this.img.content)
            }

            // does the image exist?
            if (this.missing_src()) {
                this.add_failure("image has no src or srcset attribute", this.img.line, null, this.img.content)
            } else if (this.img.url.remote()) {
                this.add_to_external_urls(this.img.url, this.img.line)
            } else if (!this.img.url.exists() && !this.img.multiple_srcsets()) {
                this.add_failure(`internal image ${this.img.url.raw_attribute} does not exist`, this.img.line, null, this.img.content)
            } else if (this.img.multiple_srcsets()) {
                const srcsets = this.img.srcset.split(",").map(x => x.trim())
                for (const srcset of srcsets) {
                    const srcset_url = new Url(this.runner, srcset, this.img.base_url)

                    if (srcset_url.remote()) {
                        this.add_to_external_urls(srcset_url.url, this.img.line)
                    } else if (!srcset_url.exists()) {
                        this.add_failure(`internal image ${srcset} does not exist`, this.img.line, null, this.img.content)
                    }
                }
            }

            if (!this.ignore_element()) {
                if (this.missing_alt_tag() && !this.ignore_missing_alt()) {
                    this.add_failure(`image ${this.img.url.raw_attribute} does not have an alt attribute`, this.img.line, null, this.img.content)
                } else if ((this.empty_alt_tag() || this.alt_all_spaces()) && !this.ignore_empty_alt()) {
                    this.add_failure(`image ${this.img.url.raw_attribute} has an alt attribute, but no content`, this.img.line, null, this.img.content)
                }
            }
            if (this.runner.enforce_https() && this.img.url.http()) {
                this.add_failure(`image ${this.img.url.raw_attribute} uses the http scheme`, this.img.line, null, this.img.content)
            }

            return this.external_urls
        })
    }

    ignore_missing_alt() {
        return this.runner.options['ignore_missing_alt']
    }

    ignore_empty_alt() {
        return this.runner.options['ignore_empty_alt']
    }

    ignore_element() {
        return this.img.url.ignore() || this.img.aria_hidden()
    }

    missing_alt_tag() {
        return this.img.node["alt"] == undefined
    }

    empty_alt_tag() {
        return !this.missing_alt_tag() && this.img.node["alt"] == ""
    }

    alt_all_spaces() {
        return !this.missing_alt_tag() && this.img.node["alt"].trim() == ""
    }

    terrible_filename() {
        const u = this.img.url.toString()
        return u ? u.match(this.SCREEN_SHOT_REGEX) : false
    }

    missing_src() {
        return isNullOrEmpty(this.img.url.toString())
    }
}