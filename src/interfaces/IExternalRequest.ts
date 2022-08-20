import {IOptions} from "./IOptions";

export interface IExternalRequest {
  url: string
  options: IOptions
  maxRedirects: number

  on_complete(response: any): void

  on_error(error: any): void

  base_url(): string
}
