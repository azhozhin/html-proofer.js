import {UrlValidator} from '../UrlValidator'
import {Url} from '../attribute/Url'
import {Hydra} from '../Hydra'
import {createDocument, unique} from '../Utils'
import {Failure} from '../Failure'
import {outdent} from 'outdent'
import {IRunner, IExternalRequest, IExtMetadata} from '../../interfaces/'

export class External extends UrlValidator {

  beforeRequest: any[];

  private readonly externalUrls: Map<string, any>
  private hydra: Hydra
  private pathsWithQueries: Map<string, string[]> = new Map()

  constructor(runner: IRunner, externalUrls: Map<string, any>) {
    super(runner)

    this.externalUrls = externalUrls
    this.beforeRequest = []

    this.hydra = new Hydra(runner.logger)
  }

  async validate() {
    if (this.cache.enabled()) {
      const urlsToCheck = this.runner.load_external_cache()
      await this.run_external_link_checker(urlsToCheck)
    } else {
      await this.run_external_link_checker(this.externalUrls)
    }

    return this.failedChecks
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
  async run_external_link_checker(links: Map<string, IExtMetadata[]>) {

    for (const [externalUrl, metadata] of links) {
      const url = new Url(this.runner, externalUrl)

      if (!url.valid()) {
        this.add_failure(metadata, `${url} is an invalid URL`, '0')
        continue
      }

      if (!this.new_url_query_values(url)) {
        continue
      }
      const method = this.runner.options.check_external_hash && url.is_hash() ? 'get' : 'head'

      this.queue_request(method, url, metadata)
    }

    await this.hydra.run()
  }

  queue_request(method: string, url: Url, filenames: IExtMetadata[]) {
    const options = Object.assign({}, this.runner.options.typhoeus, {method})
    const request: IExternalRequest = {
      url: url.url!,
      options,
      maxRedirects: 5,
      on_complete: (response) => this.response_handler(response, url, filenames),
      on_error: (error) => this.failure_handler(error, url, filenames),
      base_url: () => new URL(url.url!).origin,
    }
    for (const callback of this.beforeRequest) {
      callback(request)
    }
    this.hydra.queue(request)
  }

  failure_handler(error: any, url: Url, filenames: IExtMetadata[]) {
    const href = url.url
    if (error.message.startsWith('timeout')) {
      this.handle_timeout(href, filenames, error.code)
    } else {
      this.handle_connection_failure(href, filenames, error.code, error.message)
    }
  }

  response_handler(response: any, url: Url, filenames: IExtMetadata[]) {
    const method = response.request.method.toLowerCase()
    // const href = response.request.base_url.toString()
    const href = url.url
    const responseCode = response.status
    response.data = response.data.replace('\x00', '')

    this.logger.log('debug', `Received a ${responseCode} for ${href}`)

    if (this.runner.options.ignore_status_codes?.includes(responseCode)) {
      return
    }

    if (responseCode >= 200 && responseCode <= 299) {
      if (!this.check_hash_in_2xx_response(href, url, response, filenames)) {
        this.cache.add_external(href, filenames, responseCode, 'OK')
      }
      // } else if (false/* todo: responseCode.zero()*/) {
      //   this.handle_connection_failure(href, filenames, responseCode, response.status_message);
    } else if (method === 'head') { // # some servers don't support HEAD
      this.queue_request('get', url, filenames)
    } else {
      if (this.runner.options.only_4xx && !(responseCode >= 400 && responseCode <= 499)) {
        return
      }
      // # Received a non-successful http response.
      const statusMessage = (response.statusText) ? `: ${response.statusText}` : ''
      const msg = `External link ${href} failed${statusMessage}`
      this.add_failure(filenames, msg, responseCode)
      this.cache.add_external(href, filenames, responseCode, msg)
    }
  }

  handle_timeout(href: string | null, filenames: IExtMetadata[], responseCode: string) {
    const msg = `External link ${href} failed: got a time out (response code ${responseCode})`
    this.cache.add_external(href, filenames, 0, msg)
    if (this.runner.options.only_4xx) {
      return
    }

    this.add_failure(filenames, msg, responseCode)
  }

  //  Even though the response was a success, we may have been asked to check
  //  if the hash on the URL exists on the page
  check_hash_in_2xx_response(href: string | null, url: Url, response: any, filenames: IExtMetadata[]) {
    if (this.runner.options.only_4xx) {
      return false
    }
    if (!this.runner.options.check_external_hash) {
      return false
    }
    if (!url.is_hash()) {
      return false
    }

    const hash = url.hash

    const doc = createDocument(response.data)

    const unencodedHash = decodeURI(hash)
    const cssSelectors = [
      `[name="${hash}"]`,
      `[name="${unencodedHash}"]`,
      `[id="${hash}"]`,
      `[id="${unencodedHash}"]`,
    ]

    // # user-content is a special addition by GitHub.
    if (url.host.match(/github\.com/i)) {
      cssSelectors.push(`[name="user-content-${hash}"]`)
      cssSelectors.push(`[id="user-content-${hash}"]`)

      // when linking to a file on GitHub, like #L12-L34, only the first "L" portion
      // will be identified as a linkable portion
      const match = hash.match(/^(L\d)+/)
      if (match) {
        cssSelectors.push(`[id="${match[0]}"]`)
      }
    }

    // some (encoded and decoded) selectors could match thus do need to query twice
    const fullSelector = unique(cssSelectors).join(',')
    if (doc.css(fullSelector).length > 0) {
      return
    }

    const msg = `External link ${href} failed: ${url.sans_hash()} exists, but the hash '${hash}' does not`
    this.add_failure(filenames, msg, response.status)
    this.cache.add_external(href, filenames, response.status, msg)
    return true
  }

  handle_connection_failure(href: string | null, metadata: IExtMetadata[], responseCode: string, statusMessage: string) {
    const msgs = [outdent`
      External link ${href} failed with something very wrong.
      It's possible libcurl couldn't connect to the server, or perhaps the request timed out.
      Sometimes, making too many requests at once also breaks things.
      `, ``]

    if (statusMessage) {
      msgs.push(`Either way, the return message from the server is: ${statusMessage}`)
    }

    const msg = msgs.join('\n').trim()

    this.cache.add_external(href, metadata, 0, msg)
    if (this.runner.options.only_4xx) {
      return
    }

    this.add_failure(metadata, msg, responseCode)
  }

  add_failure(metadata: IExtMetadata[], description: string, status: string | null = null) {
    if (metadata.length === 0) { // possible if we're checking an array of links
      this.failedChecks.push(new Failure('', 'Links > External', description, null, status))
    }
    for (const m of metadata) {
      this.failedChecks.push(new Failure(m.filename, 'Links > External', description, m.line, status))
    }
  }

  new_url_query_values(url: Url) {
    if (url.query_values == null || Object.keys(url.query_values).length === 0) {
      return true
    }
    const query_values = url.query_values
    const queries = Object.keys(query_values).join('-')
    const domain_path = url.domain_path

    if (!this.pathsWithQueries.has(domain_path)) {
      this.pathsWithQueries.set(domain_path, [queries])
      return true
    } else if (!this.pathsWithQueries.get(domain_path)?.includes(queries)) {
      this.pathsWithQueries.get(domain_path)!.push(queries)
      return true
    }

    return false
  }

}
