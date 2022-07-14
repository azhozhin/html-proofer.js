import {Url} from "./attribute/url";

export class Element {
    node
    base_url
    url
    line
    content

    constructor(runner, node, base_url = null) {
        this.runner = runner
        const handler = {
            get: function (target, name){
                if (target.hasOwnProperty(name)){
                    return target[name]
                }
                // simulate nokogiri api to attributes
                if (name=="attributes"){
                    return target.attribs
                }
                return target.attribs[name]
            }
        }
        this.node = new Proxy(node, handler)

        this.base_url = base_url
        this.url = new Url(runner, this.link_attribute, base_url)

        this.line = node.sourceCodeLocation.startLine
        this.content = node.content

    }

    get link_attribute() {
        return this.meta_content || this.src || this.srcset || this.href
    }

    get meta_content() {
        if (this.meta_tag()) {
            return null
        }
        if (this.attribute_swapped()) {
            return this.swap_attributes("content")
        }
        return this.node["content"]
    }

    meta_tag() {
        return this.node.name == 'meta'
    }

    get src() {
        if (!this.img_tag() && !this.script_tag() && !this.source_tag()) {
            return null
        }
        if (this.attribute_swapped()) {
            return this.swap_attributes("src")
        }
        return this.node["src"]
    }

    img_tag() {
        return this.node.name == 'img'
    }

    script_tag() {
        return this.node.name == 'script'
    }

    get srcset() {
        if (!this.img_tag() && !this.source_tag()) {
            return null
        }
        if (this.attribute_swapped()) {
            this.swap_attributes("srcset")
        }
        return this.node["srcset"]
    }

    source_tag() {
        return this.node.name == "source"
    }

    get href() {
        if (!this.a_tag() && !this.link_tag()) {
            return null
        }
        if (this.attribute_swapped()) {
            this.swap_attributes("href")
        }
        return this.node["href"]
    }

    a_tag() {
        return this.node.name == "a"
    }


    link_tag() {
        return this.node.name == "link"
    }

    aria_hidden() {
        return this.node.attributes["aria-hidden"].value == "true"
    }



    multiple_srcsets(){
        return !(this.srcset()) && this.srcset().split(",").size > 1
    }


    ignore(){
        if (this.node.attributes["data-proofer-ignore"]){
            return true
        }
        if (this.ancestors_ignorable()){
            return true
        }
        if (this.url && this.url.ignore()){
            return true
        }

        return false
    }

    attribute_swapped(){
        if (!this.runner.options['swap_attributes']){
            return false
        }

        const attrs = this.runner.options['swap_attributes'][this.node.name]
        if (!attrs){
            return true
        }
        return false
    }

    swap_attributes(old_attr){
        const attrs = this.runner.options['swap_attributes'][this.node.name]

        const new_attr = attrs.filter(o => o == old_attr).last

        if (!new_attr){
            return null
        }

        return this.node[new_attr]
    }

    ancestors_ignorable(){
        // todo: rewrite logic
        return false
        //const ancestors_attributes = this.node.ancestors.map(a=> a.hasOwnProperty('attributes') && a.attributes)
        //ancestors_attributes.pop // remove document at the end
        //return ancestors_attributes.any? { |a| !a["data-proofer-ignore"].nil? }
    }


}