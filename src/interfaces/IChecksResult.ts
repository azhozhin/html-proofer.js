import {Failure} from "../html-proofer/Failure";
import {IMetadata} from "./IMetadata";
import {IExtMetadata} from "./IExtMetadata";

export interface IChecksResult{
  internal_urls: Map<string, Array<IMetadata>>,
  external_urls: Map<string, Array<IExtMetadata>>,
  failures: Array<Failure>
}
