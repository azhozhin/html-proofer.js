import {UrlValidator} from "../url_validator";
import {Url} from "../attribute/url";
import {Hydra} from "../hydra";
import {create_nokogiri} from "../utils";
import {Failure} from "../failure";

export class External extends UrlValidator {

    // todo
    constructor(runner, external_urls) {
        super(runner)

        this.external_urls = external_urls
        this.before_request = []

        this.paths_with_queries = {}
        this.hydra = new Hydra()
    }

    async validate() {
        if (this.cache.enabled()) {
            const urls_to_check = this.runner.load_external_cache()
            await this.run_external_link_checker(urls_to_check)
        } else {
            await this.run_external_link_checker(this.external_urls)
        }

        return this.failed_checks
    }

    // # Proofer runs faster if we pull out all the external URLs and run the checks
    // # at the end. Otherwise, we're halting the consuming process for every file during
    // # `process_files`.
    // #
    // # In addition, sorting the list lets libcurl keep connections to the same hosts alive.
    // #
    // # Finally, we'll first make a HEAD request, rather than GETing all the contents.
    // # If the HEAD fails, we'll fall back to GET, as some servers are not configured
    // # for HEAD. If we've decided to check for hashes, we must do a GET--HEAD is
    // # not available as an option.
    async run_external_link_checker(links) {
        // # Route log from Typhoeus/Ethon to our own logger
        //Ethon.logger = @logger

        for (const [external_url, metadata] of Object.entries(links)) {
            const url = new Url(this.runner, external_url)

            if (!url.valid()) {
                this.add_failure(metadata, `${url} is an invalid URL`, 0)
                continue
            }

            if (!this.new_url_query_values(url)) {
                continue
            }
            const method = this.runner.options['check_external_hash'] && url.is_hash() ? 'get' : 'head'

            this.queue_request(method, url, metadata)
        }

        await this.hydra.run()
    }

    queue_request(method, url, filenames) {
        //const opts = this.runner.options['typhoeus'].merge({method: method})
        const request = {
            url: url.url,
            options: {method: method},
            on_complete: (response) => this.response_handler(response, url, filenames)
        }
        for (const callback of this.before_request) {
            callback.call(request)
        }
        this.hydra.queue(request)
    }

    response_handler(response, url, filenames) {
        const method = response.request.method.toLowerCase()
        // const href = response.request.base_url.toString()
        const href = url.url
        const response_code = response.status
        response.data = response.data.replace("\x00", "")

        this.logger.log('debug', `Received a ${response_code} for ${href}`)

        if (this.runner.options['ignore_status_codes'].includes(response_code)) {
            return
        }

        if (response_code >= 200 && response_code <= 299) {
            if (!this.check_hash_in_2xx_response(href, url, response, filenames)) {
                this.cache.add_external(href, filenames, response_code, "OK")
            }
        } else if (response.timed_out()) {
            this.handle_timeout(href, filenames, response_code)
        } else if (response_code.zero()) {
            this.handle_connection_failure(href, filenames, response_code, response.status_message)
        } else if (method == 'head') { //# some servers don't support HEAD
            this.queue_request('get', url, filenames)
        } else {
            if (this.runner.options['only_4xx'] && !(response_code>=400 && response_code<=499)){
                return
            }
            //# Received a non-successful http response.
            const status_message = (response.status_message) ? `: ${response.status_message}` : ""
            const msg = "External link #{href} failed#{status_message}"
            this.add_failure(filenames, msg, response_code)
            this.cache.add_external(href, filenames, response_code, msg)
        }
    }

    // # Even though the response was a success, we may have been asked to check
    // # if the hash on the URL exists on the page
    check_hash_in_2xx_response(href, url, response, filenames) {
        if (this.runner.options['only_4xx']) {
            return false
        }
        if (!this.runner.options['check_external_hash']) {
            return false
        }
        if (!url.is_hash()) {
            return false
        }

        const hash = url.hash

        const body_doc = create_nokogiri(response.data)

        const unencoded_hash = decodeURI(hash)
        const xpath = [`(//*[@name="${hash}"]|/*[@name="${unencoded_hash}"]|//*[@id="${hash}"]|//*[@id="${unencoded_hash}"])`]
        //# user-content is a special addition by GitHub.

        if (url.host.match(/github\.com/i)) {
            xpath.push(`(//*[@name="user-content-${hash}"]|//*[@id="user-content-${hash}"])`)
            //# when linking to a file on GitHub, like #L12-L34, only the first "L" portion
            //# will be identified as a linkable portion
            if (hash.match(/\A(L\d)+/)) {
                xpath.push(`(//td[@id="#{Regexp.last_match[1]}"])`)
            }
        }

        if (body_doc.xpath(xpath.join("|")).length>0) {
            return
        }

        const msg = `External link ${href} failed: ${url.sans_hash} exists, but the hash '${hash}' does not`
        this.add_failure(filenames, msg, response.status)
        this.cache.add_external(href, filenames, response.status, msg)
        return true
    }

    add_failure(metadata, description, status = null) {
        if (!metadata) { // possible if we're checking an array of links
            this.failed_checks.push(new Failure("", "Links > External", description, null, status))
        }
        for (const m of metadata) {
            this.failed_checks.push(new Failure(m['filename'], "Links > External", description, m['line'], status))
        }
    }

    new_url_query_values(url) {
        if (!url.query_values) {
            return true
        }
        const query_values = url.query_values

        const queries = query_values.keys.join("-")
        const domain_path = url.domain_path
        if (!this.paths_with_queries[domain_path]) {
            this.paths_with_queries[domain_path] = [queries]
            return true
        } else if (!this.paths_with_queries[domain_path].includes(queries)) {
            this.paths_with_queries[domain_path].push(queries)
            return true
        } else {
            return false
        }
    }

}