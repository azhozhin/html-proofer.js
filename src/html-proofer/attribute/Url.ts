import {Attribute} from '../Attribute'
import * as fs from 'fs'
import * as path from 'path'
import URI from 'urijs'
import {isDirectory, isFile, isNullOrEmpty, joinUrl} from '../Utils'
import {IRunner} from "../../interfaces";

export class Url extends Attribute {
  REMOTE_SCHEMES = Array.from(['http', 'https'])
  url: string | null;
  private _parts: any;


  constructor(runner: IRunner, linkAttribute: string | null, baseUrl: string | null = null) {
    super(runner, linkAttribute)

    if (this.rawAttribute == null) {
      this.url = null
    } else {
      this.url = (this.rawAttribute as string).replace('\u200b', '').trim()
      if (baseUrl) {
        this.url = joinUrl(baseUrl, this.url as string)
      }

      this.url = this.swap_urls(this.url)
      this.url = this.clean_url(this.url)

      // convert "//" links to "https://"
      if ((this.url as string).startsWith('//')) {
        this.url = `https:${this.url}`
      }
    }
  }

  toString() {
    return this.url || ''
  }

  known_extension() {
    if (this.hash_link()) {
      return true
    }

    const ext = path.extname(this.path!)

    // no extension means we use the assumed one
    if (!ext) {
      return this.runner.options.extensions!.includes(this.runner.options.assume_extension!)
    }

    return this.runner.options.extensions!.includes(ext)
  }

  ignore() {
    if (this.url && this.url.match(/^javascript:/)) {
      return true
    }
    if (this.ignores_pattern(this.runner.options.ignore_urls!)) {
      return true
    }
  }

  sans_hash(): string {
    return this.url!.toString().replace(`#${this.hash}`, '')
  }

  // catch any obvious issues, like strings in port numbers
  private clean_url(url: string): string {
    if (url.match(/^([!-;=?-\[\]_a-z~]|%[0-9a-fA-F]{2})+$/)) {
      return url
    }
    if (this.url === '') {
      return url
    }

    url = URI(url).normalize().toString()
    return url
  }

  private swap_urls(url: string): string {
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

  ignores_pattern(linksToIgnore: (string | RegExp)[]) {
    if (!(linksToIgnore.constructor.name === 'Array')) {
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

  valid() {
    return this.parts != null
  }

  is_path() {
    return this.parts.host() != null && this.parts.path() != null
  }

  get parts() {
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

  get path() {
    return this.parts != null ? decodeURI(this.parts.path()) : null
  }

  get hash() {
    return this.parts ? this.parts.fragment() : null
  }

  is_hash() {
    return !isNullOrEmpty(this.hash)
  }

  get scheme() {
    return this.parts ? this.parts.scheme() : null
  }

  public remote(): boolean {
    return this.REMOTE_SCHEMES.includes(this.scheme)
  }

  http() {
    return this.scheme === 'http'
  }

  https() {
    return this.scheme === 'https'
  }

  isNonHttpRemote():boolean {
    return !isNullOrEmpty(this.scheme) && !this.remote()
  }

  get host() {
    return this.parts ? this.parts.hostname() : null
  }

  get domain_path() {
    return (this.host || '') + this.path
  }

  get query_values() {
    return this.parts ? this.parts.query(true) : null
  }

  exists(): boolean {
    if (this.isBase64()) {
      return true
    }
    if (this.runner.checkedPaths.has(this.absolute_path)) {
      return this.runner.checkedPaths.get(this.absolute_path)!
    }

    const checkResult = fs.existsSync(this.absolute_path)
    this.runner.checkedPaths.set(this.absolute_path, checkResult)
    return checkResult
  }

  isBase64():boolean {
    return this.rawAttribute ? this.rawAttribute.match(/^data:image/) != null : false
  }

  get absolute_path() {
    const currentPath = this.file_path || this.runner.currentFilename

    return path.resolve(currentPath!)
  }

  get file_path() {
    if (this.path == null || this.path === '') {
      return null
    }

    let pathDotExt = ''

    if (this.runner.options.assume_extension) {
      pathDotExt = this.path + this.runner.options.assume_extension
    }

    let base
    // path relative to root
    // todo: this is too complicated
    if (this.is_absolute_path(this.path)) {
      // either overwrite with root_dir; or, if source is directory, use that; or, just get the current file's dirname
      base = this.runner.options.root_dir ||
        (isDirectory(this.runner.currentSource!) ? this.runner.currentSource : path.dirname(this.runner.currentSource!))
      // relative links, path is a file
    } else if (fs.existsSync(path.resolve(this.runner.currentSource!, this.path)) ||
      fs.existsSync(path.resolve(this.runner.currentSource!, pathDotExt))) {
      base = path.dirname(this.runner.currentFilename!)
      // relative links in nested dir, path is a file
    } else if (fs.existsSync(path.join(path.dirname(this.runner.currentFilename!), this.path)) ||
      fs.existsSync(path.join(path.dirname(this.runner.currentFilename!), pathDotExt))) {
      base = path.dirname(this.runner.currentFilename!)
      // relative link, path is a directory
    } else {
      base = this.runner.currentFilename
    }

    let file = path.join(base || '', this.path)

    if (this.runner.options.assume_extension && isFile(`${file}${this.runner.options.assume_extension}`)) {
      file = `${file}${this.runner.options.assume_extension}`
    } else if (isDirectory(file) && !this.unslashed_directory(file)) { // # implicit index support
      file = path.join(file, this.runner.options.directory_index_file!)
    }

    return file
  }

  unslashed_directory(file: string): boolean {
    if (!isDirectory(file)) {
      return false
    }
    return !file.endsWith(path.sep) && !this.follow_location()
  }

  follow_location() {
    return this.runner.options.typhoeus && this.runner.options.typhoeus.followlocation
  }

  is_absolute_path(p: string): boolean {
    return p.startsWith('/')
  }

  get external(): boolean {
    return !this.internal
  }

  get internal(): boolean {
    return this.relative_link() || this.internal_absolute_link() || this.hash_link()
  }

  internal_absolute_link() {
    return this.url!.startsWith('/')
  }

  relative_link(): boolean {
    if (this.remote()) {
      return false
    }

    return this.hash_link() || this.param_link() || this.url!.startsWith('.') || this.url!.match(/^\S/) != null
  }

  hash_link(): boolean {
    return this.url!.startsWith('#')
  }

  param_link(): boolean {
    return this.url!.startsWith('?')
  }

}
