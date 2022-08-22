import {Failure} from './Failure.js'
import * as path from 'path'
import {Cli} from './reporter/Cli'
import {createDocument, mergeConcat, normalizePath, pluralize} from './Utils'
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
  ICheckResult,
  IExtMetadata,
  IHtml,
  ILogger,
  IIntMetadata,
  IOptions,
  IReporter,
  IRunner
} from "../interfaces";


export class Runner implements IRunner {

  currentSource: string | null = null
  currentFilename: string | null = null
  logger: ILogger
  cache: ICache
  options: IOptions

  checkedPaths: Map<string, boolean> = new Map()
  checkedHashes: Map<string, Map<string, boolean>> = new Map()

  private readonly type: CheckType
  private readonly sources: string[]
  private failures: Failure[] = []
  reporter: IReporter
  private internalUrls: Map<string, IIntMetadata[]> = new Map()
  externalUrls: Map<string, IExtMetadata[]> = new Map()
  private beforeRequest: any[] = []
  private _checks: any[] | null = null

  constructor(sources: string[], opts: IOptions | null = null) {
    this.options = Configuration.generate_defaults(opts)

    this.type = this.options.type!
    this.sources = sources

    this.cache = new Cache(this, this.options)
    this.logger = new Log(/*this.options['log_level']*/)
    this.reporter = new Cli(this.logger)
  }

  async run() {
    const checkText = pluralize(this.checks.length, 'check', 'checks')

    if (this.type === CheckType.LINKS) {
      this.logger.log('info',
        `Running ${checkText} (${this.formatCheckNames(this.checks)}) on ${this.sources} ... \n\n`)
      if (!this.options.disable_external) {
        await this.check_list_of_links()
      }
    } else {
      const checkNames = this.formatCheckNames(this.checks)
      const localPath = this.sources.map(s => normalizePath(s))
      const extensions = this.options.extensions!.join(', ')
      this.logger.log('info', `Running ${checkText} (${checkNames}) in ${localPath} on *${extensions} files...\n\n`)
      await this.check_files()
      this.logger.log('info', `Ran on ${pluralize(this.files.length, 'file', 'files')}!\n\n`)
    }

    this.cache.write()

    this.reporter.set_failures(this.failures)

    if (this.failures.length === 0) {
      this.logger.log('info', 'HTML-Proofer finished successfully.')
    } else {
      // @failures.uniq!
      this.report_failed_checks()
      process.exitCode = 1
    }
  }

  async check_list_of_links() {
    for (const src of this.sources) {
      const url = new Url(this, src, null).toString()
      this.externalUrls.set(url, [])
    }

    await this.validateExternalUrls()
  }

  // Walks over each implemented check and runs them on the files, in parallel.
  // Sends the collected external URLs to Typhoeus for batch processing.
  async check_files() {
    for (const result of this.process_files) {
      mergeConcat(this.externalUrls, result.externalUrls)
      mergeConcat(this.internalUrls, result.internalUrls)
      this.failures = this.failures.concat(result.failures)
    }

    if (!this.options.disable_external) {
      await this.validateExternalUrls()
    }

    await this.validateInternalUrls()
  }

  get process_files() {
    // todo: this is partial implementation
    const files = this.files
    const result = files
      .map(file => this.load_file(file.path, file.source))
    return result
  }

  load_file(p: string, source: string) {
    const doc = createDocument(p)
    return this.checkParsed(doc, p, source)
  }

  // Collects any external URLs found in a directory of files. Also collectes
  // every failed test from process_files.
  private checkParsed(html: IHtml, p: string, source: string): ICheckResult {
    const result: ICheckResult = {
      internalUrls: new Map<string, IIntMetadata[]>(),
      externalUrls: new Map<string, IExtMetadata[]>(),
      failures: new Array<Failure>()
    }

    for (const ch of this.checks) {
      this.currentSource = source
      this.currentFilename = p

      const check: ICheck = createCheck(ch, this, html)
      this.logger.log('debug', `Running ${check.name} in ${p}`)

      const checkResult = check.run()

      mergeConcat(result.externalUrls, checkResult.externalUrls)
      mergeConcat(result.internalUrls, checkResult.internalUrls)
      result.failures = result.failures.concat(checkResult.failures)
    }
    return result
  }

  private async validateExternalUrls() {
    const externalUrlValidator = new External(this, this.externalUrls)
    externalUrlValidator.beforeRequest = this.beforeRequest
    const validated = await externalUrlValidator.validate()
    this.failures = this.failures.concat(validated)
  }

  private async validateInternalUrls() {
    const internalLinkValidator = new Internal(this, this.internalUrls)
    const validated = await internalLinkValidator.validate()
    this.failures = this.failures.concat(validated)
  }

  // todo: this should not be property
  get files(): { source: string, path: string }[] {
    if (this.type === CheckType.DIRECTORY) {
      // todo: this is too complicated
      const files = this.sources.map((src) => {
        // glob accepts only forward slashes, on Windows path separator is backslash, thus should be converted
        const exts = this.options.extensions!.join(',');
        const pattern = normalizePath(path.join(src, '**', `*${exts}`))
        return glob.sync(pattern)
          .filter(file => (fs.existsSync(file) && !this.isIgnoreFile(file)))
          .map(f => ({
            source: src,
            path: f
          }))
      }).flat()
      return files
    }
    if (this.type === CheckType.FILE && this.options.extensions!.includes(path.extname(this.sources[0]))) {
      const files = this.sources.filter(f => !this.isIgnoreFile(f)).map(f => ({
        source: f,
        path: f
      }))
      return files
    }
    return []
  }

  isIgnoreFile(file: string): boolean {
    for (const pattern of this.options.ignore_files!) {
      if (pattern.constructor.name === 'String' && pattern === file) {
        return true
      }
      if (pattern.constructor.name === 'RegExp' && file.match(pattern)) {
        return true
      }
    }
    return false
  }

  checkSriOption(): boolean {
    return this.options.check_sri || false
  }

  enforceHttpsOption(): boolean {
    return this.options.enforce_https || false
  }

  get checks(): any[] {
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

  get failedChecks(): Failure[] {
    // todo: should it flatten?
    return this.reporter.failures.flat().filter(f => f.constructor.name === 'Failure')
  }

  report_failed_checks() {
    this.reporter.report()

    const failureText = pluralize(this.failures.length, 'failure', 'failures')
    this.logger.log('error', `\nHTML-Proofer found ${failureText}!`)
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
  addBeforeRequest(block: any) {
    this.beforeRequest = this.beforeRequest ? this.beforeRequest : []
    if (block) {
      this.beforeRequest.push(block)
    }
    return this.beforeRequest
  }

  public loadInternalCache(): any {
    return this.loadCache('internal')
  }

  public loadExternalCache(): any {
    return this.loadCache('external')
  }

  private formatCheckNames(checks: ICheck[]) {
    return checks.map(x => x.name).join(', ')
  }

  private loadCache(cacheType: string) {
    // todo
  }
}
