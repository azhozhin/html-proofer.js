import { Check } from '../Check';
import { last } from "../Utils";
export class Favicon extends Check {
    run() {
        let found = false;
        let favicon = null;
        this.html.css('link').each((i, node) => {
            favicon = this.create_element(node);
            if (favicon.ignore()) {
                return;
            }
            found = last(favicon.node['rel'].split(' ')) === 'icon';
            if (found) {
                return false;
            }
        });
        if (this.immediate_redirect()) {
            return;
        }
        if (found) {
            if (favicon.url.remote()) {
                this.add_to_external_urls(favicon.url, favicon.line);
            }
            else if (!favicon.url.exists()) {
                this.add_failure(`internal favicon ${favicon.url.raw_attribute} does not exist`, favicon.line, null, favicon.content);
            }
        }
        else {
            this.add_failure('no favicon provided');
        }
    }
    // allow any instant-redirect meta tag
    immediate_redirect() {
        const content = this.html.css('meta[http-equiv="refresh"]');
        if (!content || content.length === 0) {
            return false;
        }
        return content[0].attribs['content'].startsWith('0;');
    }
}