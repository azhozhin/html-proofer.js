import {Failure} from './Failure.js'
import * as path from 'path'
import {CliReporter} from './reporters/CliReporter'
import {createDocument, mergeConcat, normalizePath, pluralize} from './Utils'
import {ExternalUrlValidator} from './validators/ExternalUrlValidator'
import {InternalUrlValidator} from './validators/InternalUrlValidator'
import {Url} from './Url'
import {Configuration} from './Configuration'
import {Cache} from './Cache'
import glob from 'glob'
import fs from 'fs'
import {Log} from './Log'
import {CheckType} from "./CheckType"
import {Links} from "./checks/Links"
import {
  createCheck,
  ICache,
  ICheck,
  ICheckResult,
  IExtMetadata,
  IFile,
  IHtml,
  IIntMetadata,
  ILogger,
  IOptions,
  IReporter,
  IRunner
} from '../interfaces'


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
  private readonly exitCodeOneOnFailure: boolean

  constructor(sources: string[], opts: IOptions, reporter?: IReporter, logger?: ILogger) {
    this.sources = sources
    this.options = Configuration.generateDefaults(opts)
    this.type = this.options.type!

    this.cache = new Cache(this, this.options)
    this.logger = logger ?? new Log(this.options.log_level)
    this.reporter = reporter ?? new CliReporter(this.logger)
    this.exitCodeOneOnFailure = this.options.exitcode_one_on_failure ?? false
  }

  async run() {
    const checkText = pluralize(this.checks.length, 'check', 'checks')

    if (this.type === CheckType.LINKS) {
      this.logger.log('info',
        `Running ${checkText} (${this.formatCheckNames(this.checks)}) on ${this.sources} ... \n\n`)
      if (!this.options.disable_external) {
        await this.checkListOfLinks()
      }
    } else {
      const checkNames = this.formatCheckNames(this.checks)
      const localPath = this.sources.map(s => normalizePath(s))
      const extensions = this.options.extensions!.join(', ')
      if (this.type === CheckType.FILE){
        this.logger.log('info', `Running ${checkText} (${checkNames}) for ${localPath} ...\n\n`)
      }
      else {
        this.logger.log('info', `Running ${checkText} (${checkNames}) in ${localPath} on *${extensions} files...\n\n`)
      }

      await this.checkFiles()
      this.logger.log('info', `Ran on ${pluralize(this.files.length, 'file', 'files')}!\n\n`)
    }

    this.cache.write()

    this.reporter.setFailures(this.failures)

    if (this.failures.length === 0) {
      this.logger.log('info', 'HTML-Proofer finished successfully.')
    } else {
      // @failures.uniq!
      this.reportFailedChecks()
      if (this.exitCodeOneOnFailure){
        process.exitCode = 1
      }
    }
  }

  private async checkListOfLinks() {
    for (const src of this.sources) {
      const url = new Url(this, src, null).toString()
      this.externalUrls.set(url, [])
    }

    await this.validateExternalUrls()
  }

  // Walks over each implemented check and runs them on the files, in parallel.
  // Sends the collected external URLs to Typhoeus for batch processing.
  private async checkFiles() {
    for (const result of this.processFiles()) {
      mergeConcat(this.externalUrls, result.externalUrls)
      mergeConcat(this.internalUrls, result.internalUrls)
      this.failures = this.failures.concat(result.failures)
    }

    if (!this.options.disable_external) {
      await this.validateExternalUrls()
    }

    await this.validateInternalUrls()
  }

  private processFiles() {
    // todo: this is partial implementation
    const files = this.files
    const result: ICheckResult[] = files
      .map(file => this.loadFile(file))
    return result
  }

  private loadFile(file: IFile): ICheckResult {
    const doc = createDocument(file.path)
    return this.checkParsed(doc, file.path, file.source)
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
    const externalUrlValidator = new ExternalUrlValidator(this, this.externalUrls)
    externalUrlValidator.beforeRequest = this.beforeRequest
    const validated = await externalUrlValidator.validate()
    this.failures = this.failures.concat(validated)
  }

  private async validateInternalUrls() {
    const internalLinkValidator = new InternalUrlValidator(this, this.internalUrls)
    const validated = await internalLinkValidator.validate()
    this.failures = this.failures.concat(validated)
  }

  // todo: this should not be property
  get files(): IFile[] {
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

  private isIgnoreFile(file: string): boolean {
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

  private get checks(): any[] {
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

  private reportFailedChecks() {
    this.reporter.report()

    const failureText = pluralize(this.failures.length, 'failure', 'failures')
    this.logger.log('error', `\nHTML-Proofer found ${failureText}!`)
  }

  public addBeforeRequest(block: any) {
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
