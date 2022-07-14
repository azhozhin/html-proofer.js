import {Attribute} from "../attribute";
import fs from "fs";
import * as path from "path";


export class Url extends Attribute{
    url

    constructor(runner, link_attribute, base_url = null){
        super(runner, link_attribute)

        if (this.raw_attribute == null) {
            this.url = null
        } else {
            this.url = this.raw_attribute.replace('\u200b').trim()
            if (base_url) {
                this.url = new URL(this.url, base_url)
            }

            this.swap_urls()
            this.clean_url()

            // convert "//" links to "https://"
            if (this.url.startsWith("//")) {
                this.url = `https:${this.url}`
            }
        }
    }

    toString(){
        return this.url
    }

    known_extension() {
        if (this.hash_link()) {
            return true
        }

        const ext = path.extname(this.path)

        // no extension means we use the assumed one
        if (!ext) {
            return this.runner.options['extensions'].includes(this.runner.options['assume_extension'])
        }


        return this.runner.options['extensions'].include(ext)
    }

    unknown_extension(){
        return !known_extension
    }

    ignore(){
        if (this.url && this.url.match(/^javascript:/)){
            return true
        }
        if (this.ignores_pattern(this.runner.options['ignore_urls'])){
            return true
        }
    }

    // catch any obvious issues, like strings in port numbers
    clean_url(){
        // todo: no idea how it works
        return
        // if (this.url )
        // return if @url =~ /^([!#{Regexp.last_match(0)}-;=?-\[\]_a-z~]|%[0-9a-fA-F]{2})+$/

        this.url = new URL(this.url).toString()
    }

    swap_urls(){
        if (!this.runner.options['swap_urls']){
            return this.url
        }
        const replacements = this.runner.options['swap_urls']

        replacements.forEach((link, replace)=>{
            this.url = this.url.replace(link, replace)
        })
    }

    ignores_pattern(links_to_ignore){
        if (! (links_to_ignore.constructor.name == 'Array')){
            return false
        }

        links_to_ignore.forEach(link_to_ignore => {
            switch (link_to_ignore.constructor.name) {
                case 'string':
                    if (link_to_ignore == this.raw_attribute) {
                        return true
                    }
                    break
                case 'RegExp':
                    if (link_to_ignore.matches(this.raw_attribute)) {
                        return true
                    }
                    break
            }
        })

        return false
    }

    get path(){
        if (!this.parts){
            return decodeURI(this.parts)
        }

    }

}