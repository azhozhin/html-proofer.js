import fs from 'fs'
import * as cheerio from 'cheerio'
import URI from 'urijs'
import {IHtml, INode} from "../interfaces";

export function isFile(filepath: string): boolean {
  try {
    return fs.lstatSync(filepath).isFile()
  } catch (err) {
    return false
  }
}

export function isDirectory(filepath: string): boolean {
  try {
    return fs.lstatSync(filepath).isDirectory()
  } catch (err) {
    return false
  }
}

export function pluralize(count: number, single: string, plural: string): string {
  return `${count} ${count === 1 ? single : plural}`
}


export function createDocument(src: string): IHtml {
  let content
  if (fs.existsSync(src) && !isDirectory(src)) {
    content = fs.readFileSync(src)
  } else {
    content = src
  }
  // we need to serialize html after cheerio to make valid dom for xml manipulations
  const $ = cheerio.load(content, {sourceCodeLocationInfo: true}/*, false*/)

  // simulation of nokogiri API
  return {
    css: (selector): Array<INode> => {
      const result: Array<INode> = []
      $(selector).each((i, node) => {
        result.push(adapt_nokogiri_node($, node))
      })
      return result
    },
    content: $.html(),
    text: $.text(),
    // API to remove nodes from DOM
    remove: (node: INode): void => {
      $(node.nativeNode).remove()
    },
  }
}

function getContent($: any, node: any): string | null {
  // we need to decide if it is empty or null, cheerio does not distinguish them
  if (node.children.length === 0) {
    if (node.name === 'script') { // for self-closed script endIndex == startIndex <-- looks like a bug
      return node.endIndex - node.startIndex === 0 ? null : ''
    } else if (node.name === 'meta') { // for meta 'content is null always if 'content' is not attribute
      return null
    }
    return '' // for everything else we return empty string
  }
  return $(node).html()
}

function adapt_nokogiri_node($: cheerio.CheerioAPI, node: cheerio.Element): INode {
  return {
    name: node.name,
    // todo: this could be performance issue
    parent: (node.parent != null) ? adapt_nokogiri_node($, node.parent as cheerio.Element) : null,
    attributes: node.attribs,
    text: $(node).text(),
    content: getContent($, node),
    // technical details from parser
    sourceCodeLocation: node.sourceCodeLocation,
    nativeNode: node,
  }
}

export function isNullOrEmpty(str: string | null): boolean {
  return str == null || str === ''
}

export function mergeConcat(a: Map<string, Array<any>>, b: Map<string, Array<any>>) {
  for (const [k, v] of b) {
    if (!a.has(k)) {
      a.set(k, [])
    }
    a.set(k, a.get(k)!.concat(v))
  }
}

export function joinUrl(baseUrl: string, url: string): string {
  let theUrl = URI(url)
  if (theUrl.is('relative')) {
    theUrl = theUrl.absoluteTo(baseUrl)
  }
  return theUrl.toString()
}

export function hasUnicode(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) {
      return true
    }
  }
  return false
}

/**
 * @description
 * Takes an Array<V>, and a grouping function,
 * and returns a Map of the array grouped by the grouping function.
 *
 * @param list An array of type V.
 * @param keyGetter A Function that takes the the Array type V as an input, and returns a value of type K.
 *                  K is generally intended to be a property key of V.
 *
 * @returns Map of the array grouped by the grouping function.
 */
//export function groupBy<K, V>(list: Array<V>, keyGetter: (input: V) => K): Map<K, Array<V>> {
//    const map = new Map<K, Array<V>>();
export function groupBy<K, V>(list: Array<V>, keyGetter: (input: V) => K): Map<K, Array<V>> {
  const map = new Map<K, Array<V>>()
  list.forEach((item) => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

// Simulation of Ruby
export function last(arr: Array<any>): any {
  if (arr.length === 0) {
    return null
  }
  return arr[arr.length - 1]
}

export function first(arr: Array<any>): any {
  if (arr.length === 0) {
    return null
  }
  return arr[0]
}

export function unique(arr: Array<string>): Array<string> {
  return [...new Set(arr)]
}
