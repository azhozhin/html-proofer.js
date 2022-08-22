import {Failure} from "../html-proofer/Failure"
import {CheckType} from "../html-proofer/CheckType"
import * as cheerio from "cheerio";
import {Url} from "../html-proofer/attribute/Url";

export interface ICache {
  add_internal(url: any, metadata: any, found: any): void

  add_external(url: any, filenames: any, statusCode: any, msg: any): void

  write(): void

  enabled(): boolean
}

export type ICheckConstructor = new(runner: IRunner, html: IHtml) => ICheck

export interface ICheck {
  name: string

  run(): ICheckResult
}


export function createCheck(ctor: ICheckConstructor, runner: IRunner, html: IHtml): ICheck {
  return new ctor(runner, html)
}

export interface ICheckResult {
  internalUrls: Map<string, IIntMetadata[]>,
  externalUrls: Map<string, IExtMetadata[]>,
  failures: Failure[]
}

export interface IElement {
  node: INode
  url: Url
  line: number | null
  content: string | null
  baseUrl: string | null
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
  css(selector: string | any): INode[]

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
  checks?: any[]
  cache?: ICache

  extensions?: string[]
  ignore_files?: (string | RegExp)[]
  ignore_urls?: (string | RegExp)[]
  ignore_status_codes?: (string | number)[]
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

  set_failures(failures: Failure[]): void

  failures: Failure[]
}

export interface IRunner {
  logger: ILogger
  cache: ICache
  options: IOptions
  reporter: IReporter

  currentSource: string | null // todo: is it a real string?
  currentFilename: string | null

  run(): void

  checkSriOption(): boolean

  enforceHttpsOption(): boolean

  load_internal_cache(): any

  load_external_cache(): any

  checkedPaths: Map<string, boolean>
  checkedHashes: Map<string, Map<string, boolean>>

  failed_checks: Failure[]

  add_before_request(block: (request: any) => any): void

  externalUrls: Map<string, IExtMetadata[]>
}

export interface INode {
  name: string,
  content: string | null,
  text: string | null,
  attributes: {
    [name: string]: string;
  }
  parent: INode | null,
  // technical details from parser, this is very reduced version
  sourceCodeLocation?: {
    startLine: number
  } | null,
  nativeNode: any,
}

export type ISource = string | string[]

