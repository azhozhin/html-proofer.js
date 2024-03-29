import {UrlValidator} from './UrlValidator'
import {Failure} from '../Failure'
import * as fs from 'fs'
import {createDocument, unique} from '../Utils'
import {Url} from '../Url'
import {IRunner, IIntMetadata} from "../../interfaces"

export class InternalUrlValidator extends UrlValidator {
  private readonly internalUrls: Map<string, IIntMetadata[]>;

  constructor(runner: IRunner, internalUrls: Map<string, IIntMetadata[]>) {
    super(runner)

    this.internalUrls = internalUrls
  }

  async validate(): Promise<Failure[]> {
    if (this.cache.isEnabled()) {
      const urlsToCheck = this.runner.loadInternalCache()
      this.runInternalLinkChecker(urlsToCheck)
    } else {
      this.runInternalLinkChecker(this.internalUrls)
    }

    return this.failedChecks
  }

  private runInternalLinkChecker(links: Map<string, IIntMetadata[]>): void {
    const toAdd = []
    for (const [link, matchedFiles] of links) {
      for (const metadata of matchedFiles) {
        const url = new Url(this.runner, link, metadata.baseUrl)

        this.runner.currentSource = metadata.source
        this.runner.currentFilename = metadata.filename

        if (!this.fileExists(url)) {
          this.failedChecks.push(new Failure(metadata.filename!, 'Links > Internal',
            `internally linking to ${url}, which does not exist`, metadata.line, null, null))
          toAdd.push([url, metadata, false])
          continue
        }

        if (!this.hashExists(url)) {
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

  }

  private fileExists(url: Url): boolean {
    const absolute_path = url.absolutePath
    if (this.runner.checkedPaths.has(absolute_path)) {
      return this.runner.checkedPaths.get(url.absolutePath)!
    }
    const checkResult = fs.existsSync(absolute_path);
    this.runner.checkedPaths.set(url.absolutePath, checkResult)
    return checkResult
  }

  // verify the target hash
  private hashExists(url: Url): boolean {
    const hrefHash = url.hash
    if (!hrefHash) {
      return true
    }

    // prevents searching files we didn't ask about
    if (!url.isKnownExtension()) {
      return false
    }

    const decodedHrefHash = decodeURI(hrefHash)
    const fragmentIds = unique([hrefHash, decodedHrefHash])
    // https://www.w3.org/TR/html5/single-page.html#scroll-to-fragid
    const absolute_path = url.absolutePath

    const cacheKey = fragmentIds.join(':')
    if (this.runner.checkedHashes.has(absolute_path)) {
      const hashes = this.runner.checkedHashes.get(absolute_path)
      if (hashes!.has(cacheKey)) {
        return hashes!.get(cacheKey)!
      }
    } else {
      this.runner.checkedHashes.set(absolute_path, new Map<string, boolean>())
    }

    const hashExists = fragmentIds.includes('top') || this.findFragments(fragmentIds, url).length > 0
    this.runner.checkedHashes.get(absolute_path)!.set(cacheKey, hashExists)
    return hashExists
  }

  private findFragments(fragmentIds: string[], url: Url): any[] {
    const csss = fragmentIds.flatMap(fragId => {
      const escapedFragId = `${fragId}`.replaceAll('"', '\\\"')
      return [
        `[id = "${escapedFragId}"]`,
        `[name = "${escapedFragId}"]`]
    })

    const doc = createDocument(url.absolutePath)
    return doc.css(csss.join(','))
  }

}
