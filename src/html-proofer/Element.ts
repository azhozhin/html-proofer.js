import {Url} from './attribute/Url'
import {IElement, IHtml, INode, IRunner} from "../interfaces";

export class Element implements IElement {
  node: INode
  url: Url
  line: number | null
  content: string | null
  baseUrl: string | null

  private runner: IRunner
  private html: IHtml

  constructor(runner: IRunner, html: IHtml, node: INode, baseUrl: string | null = null) {
    this.runner = runner
    this.html = html
    this.node = node

    this.baseUrl = baseUrl
    this.url = new Url(runner, this.linkAttribute, baseUrl)

    this.line = node.sourceCodeLocation.startLine
    this.content = this.node.content
  }

  get linkAttribute() {
    return this.meta_content || this.src || this.srcset || this.href
  }

  get meta_content() {
    if (!this.isMetaTag()) {
      return null
    }
    if (this.attribute_swapped()) {
      return this.swap_attributes('content')
    }
    return this.node.attributes.content
  }

  get src() {
    if (!this.isImgTag() && !this.isScriptTag() && !this.isSourceTag()) {
      return null
    }
    if (this.attribute_swapped()) {
      return this.swap_attributes('src')
    }
    return this.node.attributes['src']
  }

  private isMetaTag(): boolean {
    return this.node.name === 'meta'
  }

  private isImgTag() {
    return this.node.name === 'img'
  }

  private isScriptTag() {
    return this.node.name === 'script'
  }

  private isSourceTag() {
    return this.node.name === 'source'
  }

  private isAnchorTag(): boolean {
    return this.node.name === 'a'
  }

  isLinkTag(): boolean {
    return this.node.name === 'link'
  }

  get srcset() {
    if (!this.isImgTag() && !this.isSourceTag()) {
      return null
    }
    if (this.attribute_swapped()) {
      this.swap_attributes('srcset')
    }
    return this.node.attributes['srcset']
  }

  get href() {
    if (!this.isAnchorTag() && !this.isLinkTag()) {
      return null
    }
    if (this.attribute_swapped()) {
      this.swap_attributes('href')
    }
    return this.node.attributes['href']
  }



  aria_hidden(): boolean {
    const ariaHidden = this.node.attributes['aria-hidden']
    return ariaHidden ? ariaHidden.value === 'true' : false
  }

  multiple_srcsets() {
    return this.srcset && this.srcset.split(',').length > 1
  }

  ignore() {
    if (this.node.attributes['data-proofer-ignore'] != null) {
      return true
    }
    if (this.ancestors_ignorable()) {
      return true
    }
    if (this.url && this.url.ignore()) {
      return true
    }

    return false
  }

  attribute_swapped() {
    if (Object.keys(this.runner.options.swap_attributes).length === 0) {
      return false
    }

    const attrs = this.runner.options.swap_attributes[this.node.name]
    if (attrs) {
      return true
    }
    return false
  }

  swap_attributes(oldAttr: string) {
    const attrs = this.runner.options.swap_attributes[this.node.name]

    // todo: too complicated
    let newAttr
    if (attrs) {
      const n = attrs.find((o: any) => o[0] === oldAttr)
      if (n) {
        newAttr = n[1]
      }
    }

    if (!newAttr) {
      return null
    }

    return this.node.attributes[newAttr]
  }

  private nodeAncestors(node: INode) {
    if (!node) {
      return []
    }

    let currentNode = node
    const ancestors = []
    while (true) {
      if (currentNode.parent == null) {
        break
      }
      ancestors.push(currentNode)
      currentNode = currentNode.parent
    }
    return ancestors.reverse()
  }

  ancestors_ignorable() {
    // todo: do we want to traverse to the top if we got ignore on lower level?
    const ancestorsAttributes = this.nodeAncestors(this.node).map(a => a.attributes)
    ancestorsAttributes.pop() // remove document at the end
    const anyAncestor = ancestorsAttributes.some(a => a['data-proofer-ignore'] != null)
    return anyAncestor
  }

}
