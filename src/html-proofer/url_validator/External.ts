import {UrlValidator} from '../UrlValidator'
import {Url} from '../attribute/Url'
import {Hydra} from '../Hydra'
import {create_nokogiri} from '../Utils'
import {Failure} from '../Failure'
import {outdent} from 'outdent'
import {IExternalRequest} from "../../interfaces/IExternalRequest";
import {IRunner} from "../../interfaces/IRunner";
import {IExtMetadata} from "../../interfaces/IExtMetadata";

export class External extends UrlValidator {

  before_request: any[];

  private readonly external_urls: Map<string, any>
  private hydra: Hydra
  private paths_with_queries: Map<string, Array<string>> = new Map()

  constructor(runner: IRunner, external_urls: Map<string, any>) {
    super(runner)

    this.external_urls = external_urls
    this.before_request = []

    this.hydra = new Hydra(runner.logger)
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

  // Proofer runs faster if we pull out all the external URLs and run the checks
  // at the end. Otherwise, we're halting the consuming process for every file during
  // `process_files`.
  //
  // In addition, sorting the list lets libcurl keep connections to the same hosts alive.
  //
  // Finally, we'll first make a HEAD request, rather than GETing all the contents.
  // If the HEAD fails, we'll fall back to GET, as some servers are not configured
  // for HEAD. If we've decided to check for hashes, we must do a GET--HEAD is
  // not available as an option.
  async run_external_link_checker(links: Map<string, Array<IExtMetadata>>) {
    //  Route log from Typhoeus/Ethon to our own logger
    //Ethon.logger = @logger

    for (const [external_url, metadata] of links) {
      const url = new Url(this.runner, external_url)

      if (!url.valid()) {
        this.add_failure(metadata, `${url} is an invalid URL`, '0')
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

  queue_request(method: string, url: Url, filenames: Array<IExtMetadata>) {
    const options = Object.assign({}, this.runner.options['typhoeus'], {method: method})
    const request: IExternalRequest = {
      url: url.url!,
      options: options,
      maxRedirects: 5,
      on_complete: (response) => this.response_handler(response, url, filenames),
      on_error: (error) => this.failure_handler(error, url, filenames),
      base_url: () => new URL(url.url!).origin,
    }
    for (const callback of this.before_request) {
      callback(request)
    }
    this.hydra.queue(request)
  }

  failure_handler(error: any, url: Url, filenames: Array<IExtMetadata>) {
    const href = url.url
    if (error.message.startsWith('timeout')) {
      this.handle_timeout(href, filenames, error.code)
    } else {
      this.handle_connection_failure(href, filenames, error.code, error.message)
    }
  }

  response_handler(response: any, url: Url, filenames: Array<IExtMetadata>) {
    const method = response.request.method.toLowerCase()
    // const href = response.request.base_url.toString()
    const href = url.url
    const response_code = response.status
    response.data = response.data.replace('\x00', '')

    this.logger.log('debug', `Received a ${response_code} for ${href}`)

    if (this.runner.options['ignore_status_codes']?.includes(response_code)) {
      return
    }

    if (response_code >= 200 && response_code <= 299) {
      if (!this.check_hash_in_2xx_response(href, url, response, filenames)) {
        this.cache.add_external(href, filenames, response_code, 'OK')
      }
      // } else if (false/* todo: response_code.zero()*/) {
      //   this.handle_connection_failure(href, filenames, response_code, response.status_message);
    } else if (method === 'head') { //# some servers don't support HEAD
      this.queue_request('get', url, filenames)
    } else {
      if (this.runner.options['only_4xx'] && !(response_code >= 400 && response_code <= 499)) {
        return
      }
      //# Received a non-successful http response.
      const status_message = (response.statusText) ? `: ${response.statusText}` : ''
      const msg = `External link ${href} failed${status_message}`
      this.add_failure(filenames, msg, response_code)
      this.cache.add_external(href, filenames, response_code, msg)
    }
  }

  handle_timeout(href: string | null, filenames: Array<IExtMetadata>, response_code: string) {
    const msg = `External link ${href} failed: got a time out (response code ${response_code})`
    this.cache.add_external(href, filenames, 0, msg)
    if (this.runner.options['only_4xx']) {
      return
    }

    this.add_failure(filenames, msg, response_code)
  }

  //  Even though the response was a success, we may have been asked to check
  //  if the hash on the URL exists on the page
  check_hash_in_2xx_response(href: string | null, url: Url, response: any, filenames: Array<IExtMetadata>) {
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
    // todo: hash and unencoded hash might match, so there is no need to query the same thing
    const csss = [
      `[name="${hash}"]`,
      `[name="${unencoded_hash}"]`,
      `[id="${hash}"]`,
      `[id="${unencoded_hash}"]`,
    ]

    //# user-content is a special addition by GitHub.
    if (url.host.match(/github\.com/i)) {
      csss.push(`[name="user-content-${hash}"]`)
      csss.push(`[id="user-content-${hash}"]`)

      // when linking to a file on GitHub, like #L12-L34, only the first "L" portion
      // will be identified as a linkable portion
      const match = hash.match(/^(L\d)+/)
      if (match) {
        csss.push(`[id="${match[0]}"]`)
      }
    }

    const full_selector = csss.join(',')
    if (body_doc.css(full_selector).length > 0) {
      return
    }

    const msg = `External link ${href} failed: ${url.sans_hash()} exists, but the hash '${hash}' does not`
    this.add_failure(filenames, msg, response.status)
    this.cache.add_external(href, filenames, response.status, msg)
    return true
  }

  handle_connection_failure(href: string | null, metadata: Array<IExtMetadata>, response_code: string, status_message: string) {
    const msgs = [outdent`
      External link ${href} failed with something very wrong.
      It's possible libcurl couldn't connect to the server, or perhaps the request timed out.
      Sometimes, making too many requests at once also breaks things.
      `, ``]

    if (status_message) {
      msgs.push(`Either way, the return message from the server is: ${status_message}`)
    }

    const msg = msgs.join('\n').trim()

    this.cache.add_external(href, metadata, 0, msg)
    if (this.runner.options['only_4xx']) {
      return
    }

    this.add_failure(metadata, msg, response_code)
  }

  add_failure(metadata: Array<IExtMetadata>, description: string, status: string | null = null) {
    if (metadata.length === 0) { // possible if we're checking an array of links
      this.failed_checks.push(new Failure('', 'Links > External', description, null, status))
    }
    for (const m of metadata) {
      this.failed_checks.push(new Failure(m.filename, 'Links > External', description, m.line, status))
    }
  }

  new_url_query_values(url: Url) {
    if (url.query_values == null || Object.keys(url.query_values).length === 0) {
      return true
    }
    const query_values = url.query_values
    const queries = Object.keys(query_values).join('-')
    const domain_path = url.domain_path

    if (!this.paths_with_queries.has(domain_path)) {
      this.paths_with_queries.set(domain_path, [queries])
      return true
    } else if (!this.paths_with_queries.get(domain_path)?.includes(queries)) {
      this.paths_with_queries.get(domain_path)!.push(queries)
      return true
    }

    return false
  }

}
