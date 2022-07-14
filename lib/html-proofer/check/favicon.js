import {Check} from "../check";
import {adapt_nokogiri_node} from "../utils";

export class Favicon extends Check {
    run() {
        let found = false
        this.html("link").each((i, node) => {
            this.favicon = this.create_element(node)

            if (this.favicon.ignore()) {
                return
            }

            found = this.favicon.node["rel"].split().last == "icon"
            if (found) {
                return false
            }
        })

        if (this.immediate_redirect()) {
            return
        }

        if (found) {
            if (this.favicon.url.remote) {
                this.add_to_external_urls(this.favicon.url, this.favicon.line)
            } else if (!this.favicon.url.exists()) {
                this.add_failure(`internal favicon ${this.favicon.url.raw_attribute} does not exist`, this.favicon.line, null, this.favicon.content)
            }
        } else {
            this.add_failure("no favicon provided")
        }
    }

    // allow any instant-redirect meta tag
    immediate_redirect() {
        const nodes = this.html('meta[http-equiv="refresh"]')
        if (nodes.length == 0) {
            return false
        }
        const meta_node = adapt_nokogiri_node(nodes.first)
        return meta_node.attributes["content"].startsWith("0;")
    }
}