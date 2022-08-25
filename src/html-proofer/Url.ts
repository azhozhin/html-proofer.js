import {Attribute} from './Attribute'
import * as fs from 'fs'
import * as path from 'path'
import URI from 'urijs'
import {isDirectory, isFile, isNullOrEmpty, joinUrl} from './Utils'
import {IRunner} from '../interfaces'

export class Url extends Attribute {
  public readonly url: string | null

  private _parts: URI | any
  private readonly REMOTE_SCHEMES = ['http', 'https']

  constructor(runner: IRunner, linkAttribute: string | null, baseUrl: string | null = null) {
    super(runner, linkAttribute)

    let url: string | null
    if (this.rawAttribute == null) {
      url = null
    } else {
      url = this.rawAttribute.replace('\u200b', '').trim()
      if (baseUrl != null) {
        url = joinUrl(baseUrl, url)
      }

      url = this.swapUrls(url)
      url = this.cleanUrl(url)

      // convert "//" links to "https://"
      if (url.startsWith('//')) {
        url = `https:${url}`
      }
    }
    this.url = url
  }

  public toString() {
    return this.url || ''
  }

  public isKnownExtension(): boolean {
    if (this.isHashLink()) {
      return true
    }

    const ext = path.extname(this.path!)

    // no extension means we use the assumed one
    if (!ext) {
      return this.runner.options.extensions!.includes(this.runner.options.assume_extension!)
    }

    return this.runner.options.extensions!.includes(ext)
  }

  public isIgnore(): boolean {
    if (this.url && this.url.match(/^javascript:/)) {
      return true
    }
    if (this.isIgnoresPattern(this.runner.options.ignore_urls!)) {
      return true
    }
    return false
  }

  public sansHash(): string {
    return this.url!.toString().replace(`#${this.hash}`, '')
  }

  // catch any obvious issues, like strings in port numbers
  private cleanUrl(url: string): string {
    if (url.match(/^([!-;=?-\[\]_a-z~]|%[0-9a-fA-F]{2})+$/)) {
      return url
    }
    if (url === '') {
      return url
    }

    const newUrl = URI(url).normalize().toString()
    return newUrl
  }

  private swapUrls(url: string): string {
    if (!this.runner.options.swap_urls) {
      return url
    }
    const replacements: Map<string, string> = this.runner.options.swap_urls

    for (const [link, replacement] of replacements) {
      // this is workaround for javascript as it is not possible to use RegExp as key for dictionary
      if (link.startsWith('/') && link.endsWith('/')) {
        const regex = new RegExp(link.replace(/^\//, '').replace(/\/$/, ''))
        url = url.replace(regex, replacement)
      } else {
        url = url.replace(link, replacement)
      }
    }
    return url
  }

  isIgnoresPattern(linksToIgnore: (string | RegExp)[]): boolean {
    if (linksToIgnore.constructor.name !== 'Array') {
      return false
    }

    for (const linkToIgnore of linksToIgnore) {
      switch (linkToIgnore.constructor.name) {
        case 'String':
          if (linkToIgnore === this.rawAttribute) {
            return true
          }
          break
        case 'RegExp':
          if (this.rawAttribute?.match(linkToIgnore)) {
            return true
          }
          break
      }
    }
    return false
  }

  isValid(): boolean {
    return this.parts != null
  }

  isPath(): boolean {
    return this.parts != null && this.parts.host() != null && this.parts.path() != null
  }

  get parts(): URI | null {
    // todo: refactor this
    if (this._parts) {
      return this._parts
    }
    try {
      this._parts = URI(this.url!)
    } catch (err) {
      this._parts = null
    }
    return this._parts
  }

  get path(): string | null {
    return this.parts != null ? decodeURI(this.parts.path()) : null
  }

  get hash(): string | null {
    return this.parts ? this.parts.fragment() : null
  }

  public isHash(): boolean {
    return !isNullOrEmpty(this.hash)
  }

  get scheme(): string | null {
    return this.parts ? this.parts.scheme() : null
  }

  public isRemote(): boolean {
    return this.scheme != null && this.REMOTE_SCHEMES.includes(this.scheme)
  }

  public isHttp(): boolean {
    return this.scheme === 'http'
  }

  public isNonHttpRemote(): boolean {
    return !isNullOrEmpty(this.scheme) && !this.isRemote()
  }

  get host() {
    return this.parts ? this.parts.hostname() : null
  }

  get domainPath() {
    return (this.host || '') + this.path
  }

  get queryValues() {
    return this.parts ? this.parts.query(true) : null
  }

  public exists(): boolean {
    if (this.isBase64()) {
      return true
    }
    if (this.runner.checkedPaths.has(this.absolutePath)) {
      return this.runner.checkedPaths.get(this.absolutePath)!
    }

    const checkResult = fs.existsSync(this.absolutePath)
    this.runner.checkedPaths.set(this.absolutePath, checkResult)
    return checkResult
  }

  private isBase64(): boolean {
    return this.rawAttribute ? this.rawAttribute.match(/^data:image/) != null : false
  }

  get absolutePath() {
    const currentPath = this.filePath || this.runner.currentFilename

    return path.resolve(currentPath!)
  }

  private get filePath(): string | null {
    if (this.path == null || this.path === '') {
      return null
    }

    const base = this.calculateBase()

    let file = path.join(base, this.path)

    const filenameWithAssumedExt = file + this.runner.options.assume_extension
    if (this.runner.options.assume_extension && isFile(filenameWithAssumedExt)) {
      file = filenameWithAssumedExt
    } else if (isDirectory(file) && !this.isUnslashedDirectory(file)) { // implicit index support
      file = path.join(file, this.runner.options.directory_index_file!)
    }

    return file
  }

  private calculateBase() {
    let pathDotExt = ''

    if (this.runner.options.assume_extension) {
      pathDotExt = this.path + this.runner.options.assume_extension
    }

    // path relative to root
    // todo: this is too complicated
    if (this.isAbsolutePath(this.path!)) {
      // either overwrite with root_dir; or, if source is directory, use that; or, just get the current file's dirname
      const sourceDirectory = isDirectory(this.runner.currentSource!) ? this.runner.currentSource! : path.dirname(this.runner.currentSource!)
      return this.runner.options.root_dir || sourceDirectory
      // relative links, path is a file
    } else if (fs.existsSync(path.resolve(this.runner.currentSource!, this.path!)) || fs.existsSync(path.resolve(this.runner.currentSource!, pathDotExt))) {
      return path.dirname(this.runner.currentFilename!)
      // relative links in nested dir, path is a file
    } else if (fs.existsSync(path.join(path.dirname(this.runner.currentFilename!), this.path!)) ||
      fs.existsSync(path.join(path.dirname(this.runner.currentFilename!), pathDotExt))) {
      return path.dirname(this.runner.currentFilename!)
      // relative link, path is a directory
    } else {
      return this.runner.currentFilename!
    }
  }

  isUnslashedDirectory(file: string): boolean {
    if (!isDirectory(file)) {
      return false
    }
    return !file.endsWith(path.sep) && !this.isFollowLocation()
  }

  private isFollowLocation(): boolean {
    return this.runner.options.typhoeus && this.runner.options.typhoeus.followlocation
  }

  private isAbsolutePath(p: string): boolean {
    return p.startsWith('/')
  }

  external(): boolean {
    return !this.isInternal()
  }

  isInternal(): boolean {
    return this.isRelativeLink() || this.isInternalAbsoluteLink() || this.isHashLink()
  }

  isInternalAbsoluteLink() {
    return this.url!.startsWith('/')
  }

  isRelativeLink(): boolean {
    if (this.isRemote()) {
      return false
    }

    return this.isHashLink() || this.isParamLink() || this.url!.startsWith('.') || this.url!.match(/^\S/) != null
  }

  isHashLink(): boolean {
    return this.url!.startsWith('#')
  }

  isParamLink(): boolean {
    return this.url!.startsWith('?')
  }

}
