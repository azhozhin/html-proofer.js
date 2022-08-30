import {Url} from './Url'
import {IElement, IHtml, INode, IRunner} from '../interfaces'
import {ElementType} from "domelementtype";

export class Element implements IElement {
  DATA_PROOFER_IGNORE = 'data-proofer-ignore'

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

    this.line = node.sourceCodeLocation!.startLine
    this.content = this.node.content
  }

  get linkAttribute() {
    return this.meta_content || this.src || this.srcset || this.href
  }

  get meta_content() {
    if (!this.isMetaTag()) {
      return null
    }
    if (this.isSwapAttributeOption()) {
      return this.swapAttributes('content')
    }
    return this.node.attributes.content
  }

  get src(): string | null {
    if (!this.isImgTag() && !this.isScriptTag() && !this.isSourceTag()) {
      return null
    }
    if (this.isSwapAttributeOption()) {
      return this.swapAttributes('src')
    }
    return this.node.attributes.src
  }

  private isMetaTag(): boolean {
    return this.node.name === 'meta'
  }

  private isImgTag(): boolean {
    return this.node.name === 'img'
  }

  private isScriptTag(): boolean {
    return this.node.name === 'script'
  }

  private isSourceTag(): boolean {
    return this.node.name === 'source'
  }

  private isAnchorTag(): boolean {
    return this.node.name === 'a'
  }

  isLinkTag(): boolean {
    return this.node.name === 'link'
  }

  get srcset(): string | null {
    if (!this.isImgTag() && !this.isSourceTag()) {
      return null
    }
    if (this.isSwapAttributeOption()) {
      this.swapAttributes('srcset')
    }
    return this.node.attributes.srcset
  }

  get href(): string | null {
    if (!this.isAnchorTag() && !this.isLinkTag()) {
      return null
    }
    if (this.isSwapAttributeOption()) {
      this.swapAttributes('href')
    }
    return this.node.attributes.href
  }

  isAriaHidden(): boolean {
    const ariaHidden = this.node.attributes['aria-hidden']
    return ariaHidden ? ariaHidden === 'true' : false
  }

  isMultipleSrcsets(): boolean {
    return this.srcset != null && this.srcset?.split(',').length > 1
  }

  isIgnore(): boolean {
    if (this.node.attributes[this.DATA_PROOFER_IGNORE] != null) {
      return true
    }
    if (this.runner.options.ancestors_ignorable && this.ancestorsIgnorable()) {
      return true
    }
    if (this.url && this.url.isIgnore()) {
      return true
    }
    return false
  }

  private isSwapAttributeOption() {
    if (Object.keys(this.runner.options.swap_attributes).length === 0) {
      return false
    }

    const attrs = this.runner.options.swap_attributes[this.node.name]
    if (attrs) {
      return true
    }
    return false
  }

  private swapAttributes(oldAttr: string) {
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

  private ancestorsIgnorable() {
    let currentNode = this.node.nativeParentNode
    while (currentNode) {
      if (currentNode.type === ElementType.Tag && currentNode.attribs[this.DATA_PROOFER_IGNORE] != null) {
        return true
      }
      currentNode = currentNode.parent
    }
    return false
  }

}
