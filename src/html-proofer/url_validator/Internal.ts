import {UrlValidator} from '../UrlValidator'
import {Failure} from '../Failure'
import * as fs from 'fs'
import {create_nokogiri, unique} from '../Utils'
import {Url} from '../attribute/Url'
import {IRunner, IMetadata} from "../../interfaces/"

export class Internal extends UrlValidator {
  private readonly internal_urls: Map<string, Array<IMetadata>>;

  constructor(runner: IRunner, internal_urls: Map<string, Array<IMetadata>>) {
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

  run_internal_link_checker(links: Map<string, Array<IMetadata>>) {
    const to_add = []
    for (const [link, matched_files] of links) {
      for (const metadata of matched_files) {
        const url = new Url(this.runner, link, metadata.base_url)

        this.runner.current_source = metadata.source
        this.runner.current_filename = metadata.filename

        if (!this.file_exists(url)) {
          this.failed_checks.push(new Failure(metadata.filename!, 'Links > Internal',
            `internally linking to ${url}, which does not exist`, metadata.line, null, null))
          to_add.push([url, metadata, false])
          continue
        }

        if (!this.hash_exists(url)) {
          this.failed_checks.push(new Failure(metadata.filename!, 'Links > Internal',
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

  file_exists(url: Url): boolean {
    const absolute_path = url.absolute_path
    if (this.runner.checked_paths.has(absolute_path)) {
      return this.runner.checked_paths.get(url.absolute_path)!
    }
    const checkResult = fs.existsSync(absolute_path);
    this.runner.checked_paths.set(url.absolute_path, checkResult)
    return checkResult
  }

  //verify the target hash
  hash_exists(url: Url): boolean {
    const href_hash = url.hash
    if (!href_hash) {
      return true
    }

    // prevents searching files we didn't ask about
    if (!url.known_extension()) {
      return false
    }

    const decoded_href_hash = decodeURI(href_hash)
    const fragment_ids = unique([href_hash, decoded_href_hash])
    // https://www.w3.org/TR/html5/single-page.html#scroll-to-fragid
    const absolute_path = url.absolute_path

    const cache_key = fragment_ids.join(':')
    if (this.runner.checked_hashes.has(absolute_path)) {
      const hashes = this.runner.checked_hashes.get(absolute_path)
      if (hashes!.has(cache_key)) {
        return hashes!.get(cache_key)!
      }
    } else {
      this.runner.checked_hashes.set(absolute_path, new Map<string, boolean>())
    }

    const hash_exists = fragment_ids.includes('top') || this.find_fragments(fragment_ids, url).length > 0
    this.runner.checked_hashes.get(absolute_path)!.set(cache_key, hash_exists)
    return hash_exists
  }

  find_fragments(fragment_ids: Array<string>, url: Url): Array<any> {
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
