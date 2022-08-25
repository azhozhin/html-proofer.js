import {Failure} from '../Failure'
import {Element} from '../Element'

import {Url} from '../Url'
import {ICheck, ICheckResult, IExtMetadata, IHtml, IIntMetadata, INode, IRunner} from '../../interfaces'


export abstract class Check implements ICheck {
  protected readonly html: IHtml
  protected readonly failures: Failure[]
  protected readonly internalUrls: Map<string, IIntMetadata[]> = new Map()
  protected readonly externalUrls: Map<string, IExtMetadata[]> = new Map()

  protected runner: IRunner
  private _baseUrl: string | null = null

  constructor(runner: IRunner, html: IHtml) {
    this.runner = runner
    this.html = this.removeIgnoredTags(html)

    this.failures = []
  }

  protected createElement(node: INode): Element {
    return new Element(this.runner, this.html, node, this.baseUrl())
  }

  abstract internalRun(): void
  public run(): ICheckResult {
    this.internalRun()
    return {
      externalUrls: this.externalUrls,
      internalUrls: this.internalUrls,
      failures: this.failures
    }
  }

  protected addFailure(description: string, line: (number | null) = null, status: (string | null) = null, content: (string | null) = null) {
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

  protected addToInternalUrls(url: Url, line: number | null) {
    const urlString = url.rawAttribute || ''

    if (!this.internalUrls.has(urlString)) {
      this.internalUrls.set(urlString, [])
    }

    const metadata: IIntMetadata = {
      source: this.runner.currentSource,
      filename: this.runner.currentFilename,
      line,
      baseUrl: this.baseUrl(),
      found: false,
    }
    this.internalUrls.get(urlString)!.push(metadata)
  }

  protected addToExternalUrls(url: Url | string | null, line: number | null): void {
    if (url == null) {
      return
    }
    const urlString = url.toString()

    if (!this.externalUrls.has(urlString)) {
      this.externalUrls.set(urlString, [])
    }

    this.externalUrls.get(urlString)!.push({
      filename: this.runner.currentFilename!,
      line,
    })
  }

  private baseUrl() {
    if (this._baseUrl) {
      return this._baseUrl
    }
    const base = this.html.css('base')
    if (base && base.length === 0) {
      this._baseUrl = null
      return null
    }
    const node = base[0]
    this._baseUrl = node.attributes.href
    return this._baseUrl
  }

}
