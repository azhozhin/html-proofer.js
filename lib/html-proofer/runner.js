import {Failure} from './failure'
import * as path from 'path'
import {Cli} from './reporter/cli'
import {create_nokogiri, mergeConcat, pluralize} from './utils'
import {Check} from './check'
import {External} from './url_validator/external'
import {Internal} from './url_validator/internal'
import {Url} from './attribute/url'
import {Configuration} from './configuration'
import {Cache} from './cache'
import glob from 'glob'
import fs from 'fs'
import {Log} from './log'

export class Runner {
  external_urls

  constructor(src, opts = {}) {
    this.options = Configuration.generate_defaults(opts)

    this.type = this.options['type']
    delete this.options['type']
    this.source = src

    this.cache = new Cache(this, this.options['cache'])
    this.logger = new Log(this.options['log_level'])

    this.external_urls = {}
    this.internal_urls = {}
    this.failures = []

    this.before_request = []
    this.checked_paths = {}

    this.current_check = null
    this.current_source = null
    this.current_filename = null

    this.reporter = new Cli(this.logger)
  }

  async run() {
    const check_text = pluralize(this.checks.length, 'check', 'checks')

    if (this.type === 'links') {
      this.logger.log('info',
          `Running ${check_text} (${this.format_checks_list(this.checks)}) on ${this.source} ... \n\n`)
      if (!this.options['disable_external']) {
        await this.check_list_of_links()
      }
    } else {
      this.logger.log('info',
          `Running ${check_text} (${this.format_checks_list(
              this.checks)}) in ${this.source} on *${this.options['extensions'].join(', ')} files...\n\n`)
      await this.check_files()
      this.logger.log('info', `Ran on ${pluralize(this.files.length, 'file', 'files')}!\n\n`)
    }

    this.cache.write()

    this.reporter.failures = this.failures

    if (this.failures.length === 0) {
      this.logger.log('info', 'HTML-Proofer finished successfully.')
    } else {
      //@failures.uniq!
      this.report_failed_checks()
    }
  }

  async check_list_of_links() {
    for (const link of this.source) {
      const url = new Url(this, link, null).toString()
      this.external_urls[url] = []
    }

    await this.validate_external_urls()
  }

  // Walks over each implemented check and runs them on the files, in parallel.
  // Sends the collected external URLs to Typhoeus for batch processing.
  async check_files() {
    for (const result of this.process_files) {
      mergeConcat(this.external_urls, result.external_urls)
      mergeConcat(this.internal_urls, result.internal_urls)
      this.failures = this.failures.concat(result.failures)
    }

    if (!this.options['disable_external']) {
      await this.validate_external_urls()
    }

    await this.validate_internal_urls()
  }

  get process_files() {
    // todo: this is partial implementation
    const result = this.files.map(file => this.load_file(file.path, file.source))
    return result
  }

  load_file(path, source) {
    this.html = create_nokogiri(path)
    return this.check_parsed(path, source)
  }

  // Collects any external URLs found in a directory of files. Also collectes
  // every failed test from process_files.
  check_parsed(p, source) {
    const result = {internal_urls: {}, external_urls: {}, failures: []}

    for (const ch of this.checks) {
      this.current_source = source
      this.current_filename = p

      const check = new ch(this, this.html)
      this.logger.log('debug', `Running ${check.short_name} in ${path}`)

      this.current_check = check

      check.run()

      //result['external_urls'].merge(check.external_urls) { |_key, old, current| old.concat(current) }
      //result['internal_urls'].merge(check.internal_urls) { |_key, old, current| old.concat(current) }
      mergeConcat(result.external_urls, check.external_urls)
      mergeConcat(result.internal_urls, check.internal_urls)
      result.failures = result.failures.concat(check.failures)
    }
    return result
  }

  async validate_external_urls() {
    const external_url_validator = new External(this, this.external_urls)
    //external_url_validator.before_request = @before_request
    const validated = await external_url_validator.validate()
    this.failures = this.failures.concat(validated)
  }

  async validate_internal_urls() {
    const internal_link_validator = new Internal(this, this.internal_urls)
    const validated = await internal_link_validator.validate()
    this.failures = this.failures.concat(validated)
  }

  get files() {
    this._files = []
    if (this.type === 'directory') {
      // todo: this is too complicated
      this._files = this.source.map((src) => {
        // glob accepts only forward slashes, on Windows path separator is backslash, thus should be converted
        const pattern = path.join(src, '**', `*${this.options['extensions'].join(',')}`).replace(/\\/g, '/')
        return glob.sync(pattern).
            filter(file => (fs.existsSync(file) && !this.ignore_file(file))).
            map(f => ({source: src, path: f}))
      }).flat()

    } else if (this.type === 'file' && this.options['extensions'].includes(path.extname(this.source))) {
      this._files = [this.source].filter(f => !this.ignore_file(f)).map(f => ({source: f, path: f}))
    }
    return this._files
  }

  ignore_file(file) {
    for (const pattern of this.options['ignore_files']) {
      if (pattern.constructor.name === 'String' && pattern === file) {
        return true
      }
      if (pattern.constructor.name === 'RegExp' && pattern.matches(file)) {
        return true
      }
    }
    return false
  }

  check_sri() {
    return this.options['check_sri']
  }

  enforce_https() {
    return this.options['enforce_https']
  }

  get checks() {
    if (this._checks) {
      return this._checks
    }
    if (this.type === 'links') {
      this._checks = ['LinkCheck']
      return this._checks
    }

    this._checks = Check.subchecks(this.options)

    return this._checks
  }

  get failed_checks() {
    return this.reporter.failures.filter(f => f.constructor.name === 'Failure')
  }

  report_failed_checks() {
    this.reporter.report()

    const failure_text = pluralize(this.failures.length, 'failure', 'failures')
    this.logger.log('error', `\nHTML-Proofer found ${failure_text}!`)
    //throw new Error('')
  }

  // # Set before_request callback.
  // #
  // # @example Set before_request.
  // #   request.before_request { |request| p "yay" }
  // #
  // # @param [ Block ] block The block to execute.
  // #
  // # @yield [ Typhoeus::Request ]
  // #
  // # @return [ Array<Block> ] All before_request blocks.
  before_request(block) {
    this.before_request = this.before_request ? this.before_request : []
    if (block) {
      this.before_request.push(block)
    }
    return this.before_request
  }

  load_internal_cache() {
    this.load_cache('internal')
  }

  load_external_cache() {
    this.load_cache('external')
  }

  get external_urls() {
    // todo
    return []
  }

  format_checks_list(checks) {
    return checks.map(x => x.name).join(', ')
  }

}