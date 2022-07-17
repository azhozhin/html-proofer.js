import {Attribute} from '../attribute'
import * as fs from 'fs'
import * as path from 'path'
import URI from 'urijs'
import {isDirectory, isFile, isNullOrEmpty} from '../utils'

export class Url extends Attribute {
  REMOTE_SCHEMES = Array.from(['http', 'https'])

  constructor(runner, link_attribute, base_url = null) {
    super(runner, link_attribute)

    if (this.raw_attribute == null) {
      this.url = null
    } else {
      this.url = this.raw_attribute.replace('\u200b').trim()
      if (base_url) {
        this.url = new URL(this.url, base_url)
      }

      this.swap_urls()
      this.clean_url()

      // convert "//" links to "https://"
      if (this.url.startsWith('//')) {
        this.url = `https:${this.url}`
      }
    }
  }

  toString() {
    return this.url
  }

  known_extension() {
    if (this.hash_link()) {
      return true
    }

    const ext = path.extname(this.path)

    // no extension means we use the assumed one
    if (!ext) {
      return this.runner.options['extensions'].includes(this.runner.options['assume_extension'])
    }

    return this.runner.options['extensions'].includes(ext)
  }

  unknown_extension() {
    return !known_extension
  }

  ignore() {
    if (this.url && this.url.match(/^javascript:/)) {
      return true
    }
    if (this.ignores_pattern(this.runner.options['ignore_urls'])) {
      return true
    }
  }

  sans_hash() {
    return this.url.toString().replace(`#${this.hash}`, '')
  }

  // catch any obvious issues, like strings in port numbers
  clean_url() {
    // todo: no idea how it works
    //return
    // if (this.url )
    // return if @url =~ /^([!#{Regexp.last_match(0)}-;=?-\[\]_a-z~]|%[0-9a-fA-F]{2})+$/

    //this.url = new URL(this.url).toString()
    //const u0 = new URL(this.url).toString()
    //const u1 = this.url.replace(/\\/g, '%5C')
    return
  }

  swap_urls() {
    if (!this.runner.options['swap_urls']) {
      return this.url
    }
    const replacements = this.runner.options['swap_urls']

    for (const [link, replacement] of Object.entries(replacements)) {
      // this is workaround for javascript as it is not possible to use RegExp as key for dictionary
      if (link.startsWith('/') && link.endsWith('/')) {
        const regex = new RegExp(link.replace(/^\//, '').replace(/\/$/, ''))
        this.url = this.url.replace(regex, replacement)
      } else {
        this.url = this.url.replace(link, replacement)
      }

    }
  }

  ignores_pattern(links_to_ignore) {
    if (!(links_to_ignore.constructor.name === 'Array')) {
      return false
    }

    for (const link_to_ignore of links_to_ignore) {
      switch (link_to_ignore.constructor.name) {
        case 'String':
          if (link_to_ignore === this.raw_attribute) {
            return true
          }
          break
        case 'RegExp':
          if (this.raw_attribute.match(link_to_ignore)) {
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
      this._parts = new URI(this.url)
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

  remote() {
    return this.REMOTE_SCHEMES.includes(this.scheme)
  }

  http() {
    return this.scheme === 'http'
  }

  https() {
    return this.scheme === 'https'
  }

  non_http_remote() {
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

  exists() {
    if (this.base64()) {
      return true
    }
    if (this.runner.checked_paths[this.absolute_path]) {
      return this.runner.checked_paths[this.absolute_path]
    }

    this.runner.checked_paths[this.absolute_path] = fs.existsSync(this.absolute_path)
    return this.runner.checked_paths[this.absolute_path]
  }

  base64() {
    return this.raw_attribute ? this.raw_attribute.match(/^data:image/) : false
  }

  get absolute_path() {
    const current_path = this.file_path || this.runner.current_filename

    return path.resolve(current_path)
  }

  get file_path() {
    if (this.path == null || this.path === '') {
      return null
    }

    let path_dot_ext = ''

    if (this.runner.options['assume_extension']) {
      path_dot_ext = this.path + this.runner.options['assume_extension']
    }

    let base
    // path relative to root
    // todo: this is too complicated
    if (this.is_absolute_path(this.path)) {
      // either overwrite with root_dir; or, if source is directory, use that; or, just get the current file's dirname
      base = this.runner.options['root_dir'] ||
          (isDirectory(this.runner.current_source) ? this.runner.current_source : path.dirname(
              this.runner.current_source))
      //relative links, path is a file
    } else if (fs.existsSync(path.resolve(this.runner.current_source, this.path)) ||
        fs.existsSync(path.resolve(this.runner.current_source, path_dot_ext))) {
      base = path.dirname(this.runner.current_filename)
      // relative links in nested dir, path is a file
    } else if (fs.existsSync(path.join(path.dirname(this.runner.current_filename), this.path)) ||
        fs.existsSync(path.join(path.dirname(this.runner.current_filename), path_dot_ext))) {
      base = path.dirname(this.runner.current_filename)
      // relative link, path is a directory
    } else {
      base = this.runner.current_filename
    }

    let file = path.join(base, this.path)

    if (this.runner.options['assume_extension'] && isFile(`${file}${this.runner.options['assume_extension']}`)) {
      file = `${file}${this.runner.options['assume_extension']}`
    } else if (isDirectory(file) && !this.unslashed_directory(file)) { //# implicit index support
      file = path.join(file, this.runner.options['directory_index_file'])
    }

    return file
  }

  unslashed_directory(file) {
    if (!isDirectory(file)) {
      return false
    }
    return !file.endsWith(path.sep) && !this.follow_location()
  }

  follow_location() {
    return this.runner.options['typhoeus'] && this.runner.options['typhoeus']['followlocation']
  }

  is_absolute_path(path) {
    return path.startsWith('/')
  }

  get external() {
    return !this.internal()
  }

  get internal() {
    return this.relative_link() || this.internal_absolute_link() || this.hash_link()
  }

  internal_absolute_link() {
    return this.url.startsWith('/')
  }

  relative_link() {
    if (this.remote()) {
      return false
    }

    return this.hash_link() || this.param_link() || this.url.startsWith('.') || this.url.match(/^\S/)
  }

  hash_link() {
    return this.url.startsWith('#')
  }

  param_link() {
    return this.url.startsWith('?')
  }

}