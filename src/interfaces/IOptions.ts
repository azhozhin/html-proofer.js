import {CheckType} from "../html-proofer/CheckType";
import {Check} from "../html-proofer/Check";

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
