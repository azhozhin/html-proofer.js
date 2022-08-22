import {UrlValidator} from '../UrlValidator'
import {Failure} from '../Failure'
import * as fs from 'fs'
import {createDocument, unique} from '../Utils'
import {Url} from '../attribute/Url'
import {IRunner, IIntMetadata} from "../../interfaces/"

export class Internal extends UrlValidator {
  private readonly internalUrls: Map<string, IIntMetadata[]>;

  constructor(runner: IRunner, internalUrls: Map<string, IIntMetadata[]>) {
    super(runner)

    this.internalUrls = internalUrls
  }

  async validate(): Promise<Failure[]> {
    if (this.cache.isEnabled()) {
      const urlsToCheck = this.runner.loadInternalCache()
      this.run_internal_link_checker(urlsToCheck)
    } else {
      this.run_internal_link_checker(this.internalUrls)
    }

    return this.failedChecks
  }

  run_internal_link_checker(links: Map<string, IIntMetadata[]>) {
    const toAdd = []
    for (const [link, matchedFiles] of links) {
      for (const metadata of matchedFiles) {
        const url = new Url(this.runner, link, metadata.baseUrl)

        this.runner.currentSource = metadata.source
        this.runner.currentFilename = metadata.filename

        if (!this.file_exists(url)) {
          this.failedChecks.push(new Failure(metadata.filename!, 'Links > Internal',
            `internally linking to ${url}, which does not exist`, metadata.line, null, null))
          toAdd.push([url, metadata, false])
          continue
        }

        if (!this.hash_exists(url)) {
          this.failedChecks.push(new Failure(metadata.filename!, 'Links > Internal',
            `internally linking to ${url}; the file exists, but the hash '${url.hash}' does not`, metadata.line,
            null, null))
          toAdd.push([url, metadata, false])
          continue
        }

        toAdd.push([url, metadata, true])
      }
    }
    // adding directly to the cache above results in an endless loop
    for (const [url, metadata, exists] of toAdd) {
      this.cache.addInternalUrl(url.toString(), metadata, exists)
    }

    return this.failedChecks
  }

  file_exists(url: Url): boolean {
    const absolute_path = url.absolute_path
    if (this.runner.checkedPaths.has(absolute_path)) {
      return this.runner.checkedPaths.get(url.absolute_path)!
    }
    const checkResult = fs.existsSync(absolute_path);
    this.runner.checkedPaths.set(url.absolute_path, checkResult)
    return checkResult
  }

  // verify the target hash
  hash_exists(url: Url): boolean {
    const hrefHash = url.hash
    if (!hrefHash) {
      return true
    }

    // prevents searching files we didn't ask about
    if (!url.known_extension()) {
      return false
    }

    const decodedHrefHash = decodeURI(hrefHash)
    const fragmentIds = unique([hrefHash, decodedHrefHash])
    // https://www.w3.org/TR/html5/single-page.html#scroll-to-fragid
    const absolute_path = url.absolute_path

    const cacheKey = fragmentIds.join(':')
    if (this.runner.checkedHashes.has(absolute_path)) {
      const hashes = this.runner.checkedHashes.get(absolute_path)
      if (hashes!.has(cacheKey)) {
        return hashes!.get(cacheKey)!
      }
    } else {
      this.runner.checkedHashes.set(absolute_path, new Map<string, boolean>())
    }

    const hashExists = fragmentIds.includes('top') || this.find_fragments(fragmentIds, url).length > 0
    this.runner.checkedHashes.get(absolute_path)!.set(cacheKey, hashExists)
    return hashExists
  }

  find_fragments(fragmentIds: string[], url: Url): any[] {
    const csss = fragmentIds.flatMap(fragId => {
      const escapedFragId = `${fragId}`.replaceAll('"', '\\\"')
      return [
        `[id = "${escapedFragId}"]`,
        `[name = "${escapedFragId}"]`]
    })

    const doc = createDocument(url.absolute_path)
    return doc.css(csss.join(','))
  }

}
