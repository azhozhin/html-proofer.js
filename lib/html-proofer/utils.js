'use strict'

import fs from 'fs'
import * as cheerio from 'cheerio'
import * as xpath from 'xpath'
import {DOMParser} from 'xmldom'
import URI from 'urijs'

export function isFile(filepath) {
  try {
    return fs.lstatSync(filepath).isFile()
  } catch (err) {
    return false
  }
}

export function isDirectory(filepath) {
  try {
    return fs.lstatSync(filepath).isDirectory()
  } catch (err) {
    return false
  }

}

export function pluralize(count, single, plural) {
  return `${count} ${count === 1 ? single : plural}`
}

export function create_nokogiri(src) {
  let content
  if (fs.existsSync(src) && !isDirectory(src)) {
    content = fs.readFileSync(src)
  } else {
    content = src
  }
  // we need to serialize html after cheerio to make valid dom for xml manipulations
  const $ = cheerio.load(content, {sourceCodeLocationInfo: true}/*, false*/)
  const doc = new DOMParser().parseFromString($('html').html(), 'text/html')
  // simulation of nokogiri API
  return {
    css: $,
    xpath: (selector) => {
      if (selector.constructor.name === 'Array') {
        return selector.map(s => xpath.select(s, doc)).flat()
      }
      return xpath.select(selector, doc)
    },
    content: $.html(),
    text: $.text(),
  }
}

export function adapt_nokogiri_node(doc, node) {
  const handler = {
    get: function(target, name) {
      if (target.hasOwnProperty(name)) {
        return target[name]
      }
      // simulate nokogiri api to attributes
      if (name === 'attributes') {
        return target.attribs
      }
      if (name === 'text') {
        return doc.css(node).text()
      }
      if (name === 'content') {
        if (target.attribs && target.attribs['content'] != null) {
          return target.attribs['content']
        }

        // we need to decide if it is empty or null, cheerio does not distinguish them
        if (node.children.length === 0) {
          if (node.name === 'script') { // for self-closed script endIndex == startIndex <-- looks like a bug
            return node.endIndex - node.startIndex === 0 ? null : ''
          } else if (node.name === 'meta') { // for meta 'content is null always if 'content' is not attribute
            return null
          }
          return '' // for everything else we return empty string
        }
        return doc.css(node).html()
      }
      return target.attribs[name]
    },
  }
  return new Proxy(node, handler)
}

export function isNullOrEmpty(str) {
  return str == null || str === ''

}

export function mergeConcat(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (!a[k]) {
      a[k] = []
    }
    a[k] = a[k].concat(v)
  }
}

export function joinUrl(baseUrl, url) {
  let theUrl = URI(url)
  if (theUrl.is('relative')) {
    theUrl = theUrl.absoluteTo(baseUrl)
  }
  return theUrl.toString()
}

export function hasUnicode(str) {
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
export function groupBy(list, keyGetter) {
  const map = new Map()
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
Object.defineProperty(Array.prototype, 'last', {
  get: function last() {
    if (this.length === 0) {
      return null
    }
    return this[this.length - 1]
  },
})

Object.defineProperty(Array.prototype, 'first', {
  get: function first() {
    if (this.length === 0) {
      return null
    }
    return this[0]
  },
})

Array.prototype.unique = function() {
  return [...new Set(this)]
}