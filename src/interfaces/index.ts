import {Failure} from "../html-proofer/Failure"
import {CheckType} from "../html-proofer/CheckType"
import * as cheerio from "cheerio";

export interface ICache {
  add_internal(url: any, metadata: any, found: any): void

  add_external(url: any, filenames: any, status_code: any, msg: any): void

  write(): void

  enabled(): boolean
}

export interface ICheckConstructor {
  new(runner: IRunner, html: IHtml): ICheck
}

export interface ICheck {
  name: string

  run(): ICheckResult
}


export function createCheck(ctor: ICheckConstructor, runner: IRunner, html: IHtml): ICheck {
  return new ctor(runner, html)
}

export interface ICheckResult {
  internal_urls: Map<string, Array<IIntMetadata>>,
  external_urls: Map<string, Array<IExtMetadata>>,
  failures: Array<Failure>
}

export interface IElement {
}


export interface IExternalRequest {
  url: string
  options: IOptions
  maxRedirects: number

  on_complete(response: any): void

  on_error(error: any): void

  base_url(): string
}


export interface IHtml {
  css(selector: string | any): any

  remove(node: any): void

  content: string
  text: string
}

export interface ILogger {
  log(level: string, message: string): void
}

export interface IIntMetadata {
  source: string | null,
  filename: string | null,
  line: number | null,
  base_url: string | null,
  found: boolean,
}

export interface IExtMetadata {
  filename: string,
  line: number | null,
}


export interface IOptions {
  type?: CheckType
  checks?: Array<any>
  cache?: ICache

  extensions?: Array<string>
  ignore_files?: Array<string | RegExp>
  ignore_urls?: Array<string | RegExp>
  ignore_status_codes?: Array<string | number>
  swap_attributes?: any // todo: make it strongly typed
  typhoeus?: any // todo: make it strongly typed
  hydra?: any // todo: make it strongly typed
  parallel?: any
  swap_urls?: Map<string, string> // todo: make it strongly typed

  root_dir?: string
  directory_index_file?: string
  log_level?: string
  assume_extension?: string

  disable_external?: boolean
  allow_hash_href?: boolean
  allow_missing_href?: boolean
  check_external_hash?: boolean
  ignore_empty_alt?: boolean
  ignore_empty_mailto?: boolean
  ignore_missing_alt?: boolean
  only_4xx?: boolean
  enforce_https?: boolean
  check_sri?: boolean

  check_opengraph?: boolean

  // todo: this is DEV only option
  use_vcr?: boolean
  verbose?: boolean
  followlocation?: boolean
  method?: string
  headers?: any
  ssl_verifypeer?: boolean


}

export const EmptyOptions: IOptions = {}


export interface IReporter {
  report(): void

  set_failures(failures: Array<Failure>): void

  failures: Array<Failure>
}

export interface IRunner {
  logger: ILogger
  cache: ICache
  options: IOptions
  reporter: IReporter

  current_source: string | null // todo: is it a real string?
  current_filename: string | null

  run(): void

  check_sri(): boolean

  enforce_https(): boolean

  load_internal_cache(): any

  load_external_cache(): any

  checked_paths: Map<string, boolean>
  checked_hashes: Map<string, Map<string, boolean>>

  failed_checks: Array<Failure>

  add_before_request(block: (request: any) => any): void

  external_urls: Map<string, Array<IExtMetadata>>
}

export interface INode {
  name: string,
  content: string | null,
  text: string | null,
  attributes: any
  parent: INode | null,
  // technical details from parser
  sourceCodeLocation: any,
  nativeNode: any,
}

export type ISource = string | Array<string>

