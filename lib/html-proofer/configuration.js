import {Links} from './check/links.js'
import {Scripts} from './check/scripts.js'
import {Images} from './check/images.js'
import {VERSION} from './version.js'
import {isNullOrEmpty} from './utils'

export class Configuration {

  static DEFAULT_TESTS = [Links, Images, Scripts]

  static PROOFER_DEFAULTS = {
    allow_hash_href: true,
    allow_missing_href: false,
    assume_extension: '.html',
    check_external_hash: true,
    checks: this.DEFAULT_TESTS,
    directory_index_file: 'index.html',
    disable_external: false,
    ignore_empty_alt: true,
    ignore_empty_mailto: false,
    ignore_files: [],
    ignore_missing_alt: false,
    ignore_status_codes: [],
    ignore_urls: [],
    enforce_https: true,
    extensions: ['.html'],
    log_level: 'info',
    only_4xx: false,
    swap_attributes: {},
    swap_urls: {},
  }

  static TYPHOEUS_DEFAULTS = {
    followlocation: true,
    headers: {
      // todo: change github repo url
      'User-Agent': `Mozilla/5.0 (compatible; HTML Proofer/${VERSION}; +https://github.com/gjtorikian/html-proofer)`,
      'Accept': 'application/xml,application/xhtml+xml,text/html;q=0.9, text/plain;q=0.8,image/png,*/*;q=0.5',
      //'Accept': '*/*',
    },
    connecttimeout: 10,
    timeout: 30,
  }

  static HYDRA_DEFAULTS = {
    max_concurrency: 50,
  }

  static PARALLEL_DEFAULTS = {
    enable: false,
  }

  static CACHE_DEFAULTS = {}

  static generate_defaults(opts) {
    const options = Object.assign({}, this.PROOFER_DEFAULTS, opts)

    options['typhoeus'] = Object.assign({}, this.TYPHOEUS_DEFAULTS, opts['typhoeus'] || {})
    options['hydra'] = Object.assign({}, this.HYDRA_DEFAULTS, opts['hydra'] || {})

    options['parallel'] = Object.assign({}, this.PARALLEL_DEFAULTS, opts['parallel'] || {})
    options['cache'] = Object.assign({}, this.CACHE_DEFAULTS, opts['cache'] || {})

    delete options['src']
    return options
  }

  static parse_json_option(option_name, config, symbolize_names = true) {
    if (option_name != null && option_name.constructor.name !== 'String') {
      throw new Error('ArgumentError: Must provide an option name in string format.')
    }
    if (isNullOrEmpty(option_name.trim())) {
      throw new Error('ArgumentError: Must provide an option name in string format.')
    }

    if (config != null && config.constructor.name !== 'String') {
      throw new Error('ArgumentError: Must provide a JSON configuration in string format.')
    }

    if (config==null || isNullOrEmpty(config.trim())) {
      return {}
    }

    try {
      return JSON.parse(config.replaceAll('\'', '"'))
    } catch (err) {
      throw new Error(`ArgumentError: Option '${option_name}' did not contain valid JSON.`)
    }

  }
}