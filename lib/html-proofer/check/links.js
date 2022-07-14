import {Check} from "../check";
import {Element} from "../element";

export class Links extends Check {
    run() {
        this.html("a, link, source").each((i, node) => {
            this.link = this.create_element(node)

            if (this.link.ignore()) {
                return
            }

            if (!this.allow_hash_href() && this.link.node["href"] == "#") {
                this.add_failure("linking to internal hash #, which points to nowhere", this.link.line, null, this.link.content)
                return
            }

            // is there even a href?
            if (!this.link.url.raw_attribute) {
                if (this.allow_missing_href()) {
                    return
                }

                this.add_failure(`'${this.link.node.name}' tag is missing a reference`, this.link.line, null, this.link.content)
                return
            }

            // is it even a valid URL?
            if (!this.link.url.valid()) {
                this.add_failure(`${this.link.href} is an invalid URL`, this.link.line, null, this.link.content)
                return
            }

            this.check_schemes()

            // intentionally down here because we still want valid? & missing_href? to execute
            if (this.link.url.non_http_remote()) {
                return
            }

            if (!this.link.url.internal && this.link.url.remote) {
                if (this.runner.check_sri() && this.link.link_tag()) {
                    this.check_sri()
                }

                // we need to skip these for now; although the domain main be valid,
                // curl/Typheous inaccurately return 404s for some links. cc https://git.io/vyCFx
                if (this.link.node["rel"] == "dns-prefetch") {
                    return
                }

                if (!this.link.url.path) {
                    this.add_failure(`${this.link.url.raw_attribute} is an invalid URL`, this.link.line, null, this.link.content)
                    return
                }

                this.add_to_external_urls(this.link.url, this.link.line)
            } else if (this.link.url.internal) {
                // does the local directory have a trailing slash?
                if (this.link.url.unslashed_directory(this.link.url.absolute_path)) {
                    this.add_failure("internally linking to a directory #{@link.url.raw_attribute} without trailing slash",
                        this.link.line, null, this.link.content)
                    return
                }
                this.add_to_internal_urls(this.link.url, this.link.line)
            }

        })

    }

    allow_missing_href() {
        return this.runner.options['allow_missing_href']
    }


    allow_hash_href() {
        return this.runner.options['allow_hash_href']
    }


    check_schemes() {
        switch (this.link.url.scheme) {
            case "mailto":
                this.handle_mailto()
                break
            case "tel":
                this.handle_tel()
                break;
            case "http":
                if (!this.runner.options['enforce_https']) {
                    return
                }
                this.add_failure(`${this.link.url.raw_attribute} is not an HTTPS link`, this.link.line, null, this.link.content)
        }
    }

    handle_mailto() {
        if (!this.link.url.path) {
            if (!this.ignore_empty_mailto()) {
                this.add_failure("#{@link.url.raw_attribute} contains no email address", this.link.line, null, this.link.content)
            }
        } else if (!(/#{URI::MailTo::EMAIL_REGEXP}/.match(this.link.url.path))) {
            this.add_failure("#{@link.url.raw_attribute} contains an invalid email address", this.link.line, null, this.link.content)
        }
    }


    handle_tel() {
        if (!this.link.url.path) {
            this.add_failure(`${this.link.url.raw_attribute} contains no phone number`, this.link.line, null, this.link.content)
        }
    }


    ignore_empty_mailto() {
        return this.runner.options['ignore_empty_mailto']
    }


    // Allowed elements from Subresource Integrity specification
    // https://w3c.github.io/webappsec-subresource-integrity/#link-element-for-stylesheets
    SRI_REL_TYPES = ['stylesheet']

    check_sri() {
        if (!this.SRI_REL_TYPES.includes(this.link.node["rel"])) {
            return
        }

        if ((!this.link.node["integrity"]) && (!this.link.node["crossorigin"])) {
            this.add_failure(`SRI and CORS not provided in: ${this.link.url.raw_attribute}`, this.link.line, null, this.link.content)
        } else if (!this.link.node["integrity"]) {
            this.add_failure(`Integrity is missing in: ${this.link.url.raw_attribute}`, this.link.line, null, this.link.content)
        } else if (!this.link.node["crossorigin"]) {
            this.add_failure(`CORS not provided for external resource in: ${this.link.url.raw_attribute}`, this.link.line, null, this.link.content)
        }

    }


    source_tag() {
        return this.link.node.name == "source"
    }

    anchor_tag() {
        return this.link.node.name == "a"
    }

    create_element(node) {
        return new Element(this.runner, node, this.base_url())
    }



}