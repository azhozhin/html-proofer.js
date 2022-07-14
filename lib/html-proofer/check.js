import {Failure} from "./failure";
import {Element} from "./element";

export class Check {
    runner
    html
    external_urls
    internal_urls
    failures

    constructor(runner, html) {
        this.runner = runner
        this.html = this.remove_ignored(html)

        this.external_urls = {}
        this.internal_urls = {}
        this.failures = []
    }

    create_element(node){
        return new Element(this.runner, node, this.base_url())
    }

    run(){
        throw new Error('NotImplementedError')
    }

    add_failure(description, line= null, status= null, content= null){
        this.failures.push(new Failure(this.runner.current_filename, this.short_name, description, line, status, content))
    }

    subchecks(runner_options){
        // grab all known checks
        // checks = ObjectSpace.each_object(Class).select do |klass|
        // klass < self
        // end
        //
        // // remove any checks not explicitly included
        // checks.each_with_object([]) do |check, arr|
        // next unless runner_options[:checks].include?(check.short_name)
        //
        //     arr << check
        // end
        // todo: hardcoded
        return [{name: 'Links'}]
    }

    remove_ignored(html) {
        if (!html) {
            return
        }

        //todo: remove ignored tags
        //html.css("code, pre, tt").each(&:unlink)
        return html
    }

    get short_name(){
        // self.class.name.split("::").last
        return this.constructor.name
    }

    add_to_internal_urls(url, line) {
        const url_string = url.raw_attribute

        if (!this.internal_urls[url_string]) {
            this.internal_urls[url_string] = []
        }

        const metadata = {
            source: this.runner.current_source,
            filename: this.runner.current_filename,
            line: line,
            base_url: this.base_url(),
            found: false,
        }
        this.internal_urls[url_string].push(metadata)
    }

    add_to_external_urls(url, line){
        const url_string = url.toString()

        if (!this.external_urls[url_string]){
            this.external_urls[url_string] = []
        }

        this.external_urls[url_string].push({
            filename: this.runner.current_filename,
            line: line
        })
    }


    base_url(){
        if (this._base_url){
            return this._base_url
        }
        const base = this.html("base")
        if (base && base.length == 0) {
            this._base_url = null
            return null
        }
        // todo: base["href"] does not work properly
        this._base_url = base["href"]
        return this._base_url
    }
}