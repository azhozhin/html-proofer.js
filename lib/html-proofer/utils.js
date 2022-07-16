'use strict'

import fs from 'fs'
import * as cheerio from 'cheerio'
import * as xpath from 'xpath'
import {DOMParser} from 'xmldom'
import {select} from 'xpath'

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
  return `${count} ${count == 1 ? single : plural}`
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

export function adapt_nokogiri_node(html, node) {
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
        return html.css(node).text()
      }
      if (name === 'content') {
        if (target.attribs && target.attribs['content']){
          return target.attribs['content']
        }
        return html.css(node).html()
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