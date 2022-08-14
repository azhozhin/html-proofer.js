import {UrlValidator} from '../url_validator.js'
import {Failure} from '../failure.js'
import * as fs from 'fs'
import {create_nokogiri} from '../utils.js'
import {Url} from '../attribute/url.js'

export class Internal extends UrlValidator {
  constructor(runner, internal_urls) {
    super(runner)

    this.internal_urls = internal_urls
  }

  async validate() {
    // if (this.cache.enabled) {
    //   const urls_to_check = this.runner.load_internal_cache()
    //   this.run_internal_link_checker(urls_to_check)
    // } else {
      this.run_internal_link_checker(this.internal_urls)
    // }

    return this.failed_checks
  }

  run_internal_link_checker(links) {
    const to_add = []
    for (const [link, matched_files] of Object.entries(links)) {
      for (const metadata of matched_files) {
        const url = new Url(this.runner, link, metadata['base_url'])

        this.runner.current_source = metadata['source']
        this.runner.current_filename = metadata['filename']

        if (!this.file_exists(url)) {
          this.failed_checks.push(new Failure(this.runner.current_filename, 'Links > Internal',
              `internally linking to ${url}, which does not exist`, metadata['line'], null, null))
          to_add.push([url, metadata, false])
          continue
        }

        if (!this.hash_exists(url)) {
          this.failed_checks.push(new Failure(this.runner.current_filename, 'Links > Internal',
              `internally linking to ${url}; the file exists, but the hash '${url.hash}' does not`, metadata['line'],
              null, null))
          to_add.push([url, metadata, false])
          continue
        }

        to_add.push([url, metadata, true])
      }
    }
    // adding directly to the cache above results in an endless loop
    for (const [url, metadata, exists] of to_add) {
      this.cache.add_internal(url.toString(), metadata, exists)
    }

    return this.failed_checks
  }

  file_exists(url) {
    const absolute_path = url.absolute_path
    if (this.runner.checked_paths[absolute_path]) {
      return this.runner.checked_paths[url.absolute_path]
    }
    this.runner.checked_paths[url.absolute_path] = fs.existsSync(absolute_path)
    return this.runner.checked_paths[url.absolute_path]
  }

  //verify the target hash
  hash_exists(url) {
    const href_hash = url.hash
    if (!href_hash) {
      return true
    }

    // prevents searching files we didn't ask about
    if (!url.known_extension()) {
      return false
    }

    const decoded_href_hash = decodeURI(href_hash)
    const fragment_ids = [href_hash, decoded_href_hash].unique()
    // https://www.w3.org/TR/html5/single-page.html#scroll-to-fragid
    const absolute_path = url.absolute_path

    const cache_key = fragment_ids.join(':')
    if (this.runner.checked_hashes[absolute_path]){
      const hashes = this.runner.checked_hashes[absolute_path]
      if (hashes[cache_key]){
        return hashes[cache_key]
      }
    } else {
      this.runner.checked_hashes[absolute_path] = {}
    }

    const hash_exists = fragment_ids.includes('top') || this.find_fragments(fragment_ids, url).length > 0
    this.runner.checked_hashes[absolute_path][cache_key] = hash_exists
    return hash_exists
  }

  find_fragments(fragment_ids, url) {
    const csss = fragment_ids.flatMap(frag_id => {
      const escaped_frag_id = `${frag_id}`.replaceAll('"', '\\\"')
      return [
        `[id = "${escaped_frag_id}"]`,
        `[name = "${escaped_frag_id}"]`]
    })

    const html = create_nokogiri(url.absolute_path)
    return html.css(csss.join(','))
  }

}
