import { Url } from './attribute/Url';
export class Element {
    constructor(runner, html, node, base_url = null) {
        this.runner = runner;
        this.html = html;
        this.node = node;
        this.base_url = base_url;
        this.url = new Url(runner, this.link_attribute, base_url);
        this.line = node.sourceCodeLocation.startLine;
        this.content = this.node.content;
    }
    get link_attribute() {
        return this.meta_content || this.src || this.srcset || this.href;
    }
    get meta_content() {
        if (!this.meta_tag()) {
            return null;
        }
        if (this.attribute_swapped()) {
            return this.swap_attributes('content');
        }
        return this.node.attributes['content'];
    }
    meta_tag() {
        return this.node.name === 'meta';
    }
    get src() {
        if (!this.img_tag() && !this.script_tag() && !this.source_tag()) {
            return null;
        }
        if (this.attribute_swapped()) {
            return this.swap_attributes('src');
        }
        return this.node.attributes['src'];
    }
    img_tag() {
        return this.node.name === 'img';
    }
    script_tag() {
        return this.node.name === 'script';
    }
    get srcset() {
        if (!this.img_tag() && !this.source_tag()) {
            return null;
        }
        if (this.attribute_swapped()) {
            this.swap_attributes('srcset');
        }
        return this.node.attributes['srcset'];
    }
    source_tag() {
        return this.node.name === 'source';
    }
    get href() {
        if (!this.a_tag() && !this.link_tag()) {
            return null;
        }
        if (this.attribute_swapped()) {
            this.swap_attributes('href');
        }
        return this.node.attributes['href'];
    }
    a_tag() {
        return this.node.name === 'a';
    }
    link_tag() {
        return this.node.name === 'link';
    }
    aria_hidden() {
        const aria_hidden = this.node.attributes['aria-hidden'];
        return aria_hidden ? aria_hidden.value === 'true' : false;
    }
    multiple_srcsets() {
        return this.srcset && this.srcset.split(',').length > 1;
    }
    ignore() {
        if (this.node.attributes['data-proofer-ignore'] != null) {
            return true;
        }
        if (this.ancestors_ignorable()) {
            return true;
        }
        if (this.url && this.url.ignore()) {
            return true;
        }
        return false;
    }
    attribute_swapped() {
        if (Object.keys(this.runner.options['swap_attributes']).length === 0) {
            return false;
        }
        const attrs = this.runner.options['swap_attributes'][this.node.name];
        if (attrs) {
            return true;
        }
        return false;
    }
    swap_attributes(old_attr) {
        const attrs = this.runner.options['swap_attributes'][this.node.name];
        // todo: too complicated
        let new_attr;
        if (attrs) {
            const n = attrs.find((o) => o[0] === old_attr);
            if (n) {
                new_attr = n[1];
            }
        }
        if (!new_attr) {
            return null;
        }
        return this.node.attributes[new_attr];
    }
    node_ancestors(node) {
        if (!node) {
            return [];
        }
        let current_node = node;
        const ancestors = [];
        while (true) {
            if (current_node.parent == null) {
                break;
            }
            ancestors.push(current_node);
            current_node = current_node.parent;
        }
        return ancestors.reverse();
    }
    ancestors_ignorable() {
        const ancestors_attributes = this.node_ancestors(this.node).map(a => a.attributes);
        ancestors_attributes.pop(); // remove document at the end
        const any_ancestor = ancestors_attributes.some(a => a['data-proofer-ignore'] != null);
        return any_ancestor;
    }
}
