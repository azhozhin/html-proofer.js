import fs from 'fs'
import * as cheerio from 'cheerio'
import URI from 'urijs'
import {IHtml, INode} from '../interfaces'

export const isFile = (filepath: string): boolean => {
  try {
    return fs.lstatSync(filepath).isFile()
  } catch (err) {
    return false
  }
}

export const isDirectory = (filepath: string): boolean => {
  try {
    return fs.lstatSync(filepath).isDirectory()
  } catch (err) {
    return false
  }
}

export const pluralize = (count: number, single: string, plural: string): string => {
  return `${count} ${count === 1 ? single : plural}`
}


export const createDocument = (src: string): IHtml => {
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
    css: (selector): INode[] => {
      const result: INode[] = []
      $(selector).each((i, node) => {
        result.push(adaptNode($, node))
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

const getContent = ($: any, node: any): string | null => {
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

const adaptNode = ($: cheerio.CheerioAPI, node: cheerio.Element): INode => {
  return {
    name: node.name,
    // todo: this could be performance issue
    parent: (node.parent != null) ? adaptNode($, node.parent as cheerio.Element) : null,
    attributes: node.attribs,
    text: $(node).text(),
    content: getContent($, node),
    // technical details from parser
    sourceCodeLocation: node.sourceCodeLocation,
    nativeNode: node,
  }
}

export const isNullOrEmpty = (str: string | null): boolean => {
  return str == null || str === ''
}

export const mergeConcat = (a: Map<string, any[]>, b: Map<string, any[]>): void => {
  for (const [k, v] of b) {
    if (!a.has(k)) {
      a.set(k, [])
    }
    a.set(k, a.get(k)!.concat(v))
  }
}

export const joinUrl = (baseUrl: string, url: string): string => {
  let theUrl = URI(url)
  if (theUrl.is('relative')) {
    theUrl = theUrl.absoluteTo(baseUrl)
  }
  return theUrl.toString()
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
export const groupBy = <K, V>(list: V[], keyGetter: (input: V) => K): Map<K, V[]> => {
  const map = new Map<K, V[]>()
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
export const last = (arr: any[]): any => {
  if (arr.length === 0) {
    return null
  }
  return arr[arr.length - 1]
}

export const first = (arr: any[]): any => {
  if (arr.length === 0) {
    return null
  }
  return arr[0]
}

export const unique = (arr: string[]): string[] => {
  return [...new Set(arr)]
}

export const normalizePath = (source: string): string => {
  return source.replaceAll('\\', '/')
}

