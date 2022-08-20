import {Failure} from './Failure'
import {Element} from './Element'
import {adapt_nokogiri_node} from './Utils'

import {Url} from "./attribute/Url";
import {ICheck, ICheckResult, IExtMetadata, IHtml, IIntMetadata, IRunner} from "../interfaces";


export abstract class Check implements ICheck {
  html: IHtml
  public failures: Array<Failure>
  public internal_urls: Map<string, Array<IIntMetadata>> = new Map()
  public external_urls: Map<string, Array<IExtMetadata>> = new Map()

  protected runner: IRunner
  private _base_url: string | null = null

  constructor(runner: IRunner, html: IHtml) {
    this.runner = runner
    this.html = this.removeIgnoredTags(html)

    this.failures = []
  }

  protected create_element(node: any): Element {
    return new Element(this.runner, this.html, node, this.base_url())
  }

  public abstract run(): ICheckResult

  protected add_failure(description: string, line: (number | null) = null, status: (string | null) = null, content: (string | null) = null) {
    this.failures.push(new Failure(this.runner.current_filename!, this.name, description, line, status, content))
  }

  private removeIgnoredTags(html: IHtml) {
    for (const node of html.css("code, pre, tt")) {
      html.css(node).remove()
    }
    return html
  }

  public get name(): string {
    return this.constructor.name
  }

  protected add_to_internal_urls(url: Url, line: number | null) {
    const url_string = url.raw_attribute || ''

    if (!this.internal_urls.has(url_string)) {
      this.internal_urls.set(url_string, [])
    }

    const metadata: IIntMetadata = {
      source: this.runner.current_source,
      filename: this.runner.current_filename,
      line: line,
      base_url: this.base_url(),
      found: false,
    }
    this.internal_urls.get(url_string)!.push(metadata)
  }

  protected add_to_external_urls(url: Url, line: number | null): void {
    const url_string = url.toString()

    if (!this.external_urls.has(url_string)) {
      this.external_urls.set(url_string, [])
    }

    this.external_urls.get(url_string)!.push({
      filename: this.runner.current_filename!,
      line: line,
    })
  }

  base_url() {
    if (this._base_url) {
      return this._base_url
    }
    const base = this.html.css('base')
    if (base && base.length == 0) {
      this._base_url = null
      return null
    }
    const node = adapt_nokogiri_node(this.html, base[0])
    this._base_url = node['href']
    return this._base_url
  }

}
