import {Failure} from './Failure'
import {Element} from './Element'

import {Url} from "./attribute/Url";
import {ICheck, ICheckResult, IExtMetadata, IHtml, IIntMetadata, IRunner} from "../interfaces";


export abstract class Check implements ICheck {
  html: IHtml
  public failures: Failure[]
  public internalUrls: Map<string, IIntMetadata[]> = new Map()
  public externalUrls: Map<string, IExtMetadata[]> = new Map()

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
    this.failures.push(new Failure(this.runner.currentFilename!, this.name, description, line, status, content))
  }

  private removeIgnoredTags(html: IHtml) {
    for (const node of html.css("code, pre, tt")) {
      html.remove(node)
    }
    return html
  }

  public get name(): string {
    return this.constructor.name
  }

  protected add_to_internal_urls(url: Url, line: number | null) {
    const urlString = url.rawAttribute || ''

    if (!this.internalUrls.has(urlString)) {
      this.internalUrls.set(urlString, [])
    }

    const metadata: IIntMetadata = {
      source: this.runner.currentSource,
      filename: this.runner.currentFilename,
      line,
      base_url: this.base_url(),
      found: false,
    }
    this.internalUrls.get(urlString)!.push(metadata)
  }

  protected add_to_external_urls(url: Url, line: number | null): void {
    const urlString = url.toString()

    if (!this.externalUrls.has(urlString)) {
      this.externalUrls.set(urlString, [])
    }

    this.externalUrls.get(urlString)!.push({
      filename: this.runner.currentFilename!,
      line,
    })
  }

  base_url() {
    if (this._base_url) {
      return this._base_url
    }
    const base = this.html.css('base')
    if (base && base.length === 0) {
      this._base_url = null
      return null
    }
    const node = base[0]
    this._base_url = node.attributes.href
    return this._base_url
  }

}
