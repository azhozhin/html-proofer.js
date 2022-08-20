import {Failure} from './Failure.js'
import * as path from 'path'
import {Cli} from './reporter/Cli'
import {create_nokogiri, mergeConcat, pluralize} from './Utils'
import {Check} from './Check.js'
import {External} from './url_validator/External'
import {Internal} from './url_validator/Internal'
import {Url} from './attribute/Url'
import {Configuration} from './Configuration'
import {Cache} from './Cache'
import glob from 'glob'
import fs from 'fs'
import {Log} from './Log'
import {CheckType} from "./CheckType"
import {Links} from "./check/Links"
import {
  createCheck,
  ICache,
  ICheck,
  IChecksResult,
  IExtMetadata,
  IHtml,
  ILogger,
  IMetadata,
  IOptions,
  IReporter,
  IRunner, ISource
} from "../interfaces";

function normalize_path(source: string | Array<string>) {
  if (source.constructor.name === 'String') {
    return (source as string).replaceAll('\\', '/')
  } else if (source.constructor.name === 'Array') {
    return (source as Array<string>).map(e => e.replaceAll('\\', '/'))
  }
}

export class Runner implements IRunner {
  current_source: string | null
  current_filename: string | null;
  logger: ILogger
  cache: ICache
  options: IOptions

  checked_paths: Map<string, boolean>
  checked_hashes: Map<string, Map<string, boolean>>

  private readonly type: CheckType
  private readonly sources: ISource
  private failures: Array<Failure>
  reporter: IReporter
  private internal_urls: Map<string, Array<IMetadata>> = new Map()
  external_urls: Map<string, Array<IExtMetadata>> = new Map()
  private current_check: ICheck | null
  private before_request: any[]
  private _checks: any[] | null = null

  constructor(sources: ISource, opts: IOptions | null = null) {
    this.options = Configuration.generate_defaults(opts)

    this.type = this.options.type!
    this.sources = sources

    this.cache = new Cache(this, this.options)
    this.logger = new Log(/*this.options['log_level']*/)


    this.failures = []

    this.before_request = []
    this.checked_paths = new Map<string, boolean>()
    this.checked_hashes = new Map<string, Map<string, boolean>>()

    this.current_check = null
    this.current_source = null
    this.current_filename = null

    this.reporter = new Cli(this.logger)
  }

  async run() {
    const checkText = pluralize(this.checks.length, 'check', 'checks')

    if (this.type === CheckType.LINKS) {
      this.logger.log('info',
        `Running ${checkText} (${this.format_checks_list(this.checks)}) on ${this.sources} ... \n\n`)
      if (!this.options['disable_external']) {
        await this.check_list_of_links()
      }
    } else {
      const checkNames = this.format_checks_list(this.checks)
      const localPath = normalize_path(this.sources)
      const extensions = this.options['extensions']!.join(', ')
      this.logger.log('info', `Running ${checkText} (${checkNames}) in ${localPath} on *${extensions} files...\n\n`)
      await this.check_files()
      this.logger.log('info', `Ran on ${pluralize(this.files.length, 'file', 'files')}!\n\n`)
    }

    this.cache.write()

    this.reporter.set_failures(this.failures)

    if (this.failures.length === 0) {
      this.logger.log('info', 'HTML-Proofer finished successfully.')
    } else {
      //@failures.uniq!
      this.report_failed_checks()
      process.exitCode = 1
    }
  }

  async check_list_of_links() {
    for (const src of this.sources) {
      const url = new Url(this, src, null).toString()
      this.external_urls.set(url, [])
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
    const files = this.files
    const result = files.map(file => this.load_file(file.path, file.source))
    return result
  }

  load_file(path: string, source: string) {
    const html = create_nokogiri(path)
    return this.check_parsed(html, path, source)
  }

  // Collects any external URLs found in a directory of files. Also collectes
  // every failed test from process_files.
  check_parsed(html: IHtml, p: string, source: string): IChecksResult {
    const result: IChecksResult = {
      internal_urls: new Map<string, Array<IMetadata>>(),
      external_urls: new Map<string, Array<IExtMetadata>>(),
      failures: new Array<Failure>()
    }

    for (const ch of this.checks) {
      this.current_source = source
      this.current_filename = p

      const check:ICheck = createCheck(ch, this, html)
      this.logger.log('debug', `Running ${check.name} in ${p}`)

      this.current_check = check

      // todo: it is better to return all stuff as result rather than properties
      check.run()

      mergeConcat(result.external_urls, check.external_urls)
      mergeConcat(result.internal_urls, check.internal_urls)
      result.failures = result.failures.concat(check.failures)
    }
    return result
  }

  private async validate_external_urls() {
    const external_url_validator = new External(this, this.external_urls)
    external_url_validator.before_request = this.before_request
    const validated = await external_url_validator.validate()
    this.failures = this.failures.concat(validated)
  }

  private async validate_internal_urls() {
    const internal_link_validator = new Internal(this, this.internal_urls)
    const validated = await internal_link_validator.validate()
    this.failures = this.failures.concat(validated)
  }

  // todo: this should not be property
  get files(): { source: string, path: string }[] {
    if (this.type === CheckType.DIRECTORY) {
      // todo: this is too complicated
      let files = (this.sources as Array<string>).map((src) => {
        // glob accepts only forward slashes, on Windows path separator is backslash, thus should be converted
        const pattern = path.join(src, '**', `*${this.options['extensions']!.join(',')}`).replace(/\\/g, '/')
        return glob.sync(pattern)
          .filter(file => (fs.existsSync(file) && !this.ignore_file(file)))
          .map(f => ({
            source: src,
            path: f
          }))
      }).flat()
      return files
    }
    if (this.type === CheckType.FILE && this.options['extensions']!.includes(path.extname((this.sources as string)))) {
      let files = [(this.sources as string)].filter(f => !this.ignore_file(f)).map(f => ({
        source: f,
        path: f
      }))
      return files
    }
    return []
  }

  ignore_file(file: string): boolean {
    for (const pattern of this.options['ignore_files']!) {
      if (pattern.constructor.name === 'String' && pattern === file) {
        return true
      }
      if (pattern.constructor.name === 'RegExp' && file.match(pattern)) {
        return true
      }
    }
    return false
  }

  check_sri(): boolean {
    return this.options.check_sri || false
  }

  enforce_https(): boolean {
    return this.options.enforce_https || false
  }

  get checks(): Array<any> {
    if (this._checks) {
      return this._checks
    }
    if (this.type === CheckType.LINKS) {
      this._checks = [Links]
      return this._checks
    }

    this._checks = this.options.checks!

    return this._checks
  }

  get failed_checks(): Array<Failure> {
    // todo: should it flatten?
    return this.reporter.failures.flat().filter(f => f.constructor.name === 'Failure')
  }

  report_failed_checks() {
    this.reporter.report()

    const failure_text = pluralize(this.failures.length, 'failure', 'failures')
    this.logger.log('error', `\nHTML-Proofer found ${failure_text}!`)
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
  add_before_request(block:any) {
    this.before_request = this.before_request ? this.before_request : []
    if (block) {
      this.before_request.push(block)
    }
    return this.before_request
  }

  public load_internal_cache(): any {
    return this.load_cache('internal')
  }

  public load_external_cache(): any {
    return this.load_cache('external')
  }

  format_checks_list(checks: Array<ICheck>) {
    return checks.map(x => x.name).join(', ')
  }

  private load_cache(cacheType: string) {
    // todo
  }
}
