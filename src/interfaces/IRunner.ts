import {ILogger} from "./ILogger";
import {IOptions} from "./IOptions";
import {Failure} from "../html-proofer/Failure";
import {IReporter} from "./IReporter";
import {IExtMetadata} from "./IExtMetadata";

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
