"use strict";

import fs from "fs"
import * as cheerio from "cheerio"
import * as xpath from "xpath";
import {DOMParser} from "xmldom";
import {select} from "xpath";

export function isFile(fullpath) {
    try {
        return fs.lstatSync(fullpath).isFile()
    } catch (err) {
        return false
    }

}

export function isDirectory(fullpath) {
    try {
        return fs.lstatSync(fullpath).isDirectory()
    } catch (err) {
        return false
    }

}

export function pluralize(count, single, plural) {
    return `${count} ${count == 1 ? single : plural}`
}

export function create_nokogiri(fullpath) {
    let content
    if (fs.existsSync(fullpath) && !isDirectory(fullpath)) {
        content = fs.readFileSync(fullpath)
    } else {
        content = fullpath
    }
    // we need to serialize html after cheerio to make valid dom for xml manipulations
    const $ = cheerio.load(content, {sourceCodeLocationInfo: true}/*, false*/)
    const doc = new DOMParser().parseFromString($('html').html(), "text/html")
    // simulation of nokogiri API
    return {
        css: $,
        xpath: (selector) => {
            if (selector.constructor.name==="Array"){
                return selector.map(s=> xpath.select(s, doc))
            }
            return xpath.select(selector, doc)
        },
        content: $.html(),
        text: $.text(),
    }
}

export function adapt_nokogiri_node(html, node) {
    const handler = {
        get: function (target, name) {
            if (target.hasOwnProperty(name)) {
                return target[name]
            }
            // simulate nokogiri api to attributes
            if (name == "attributes") {
                return target.attribs
            }
            if (name == "text") {
                return html.css(node).text()
            }
            if (name == "content") {
                return html.css(node).html()
            }
            return target.attribs[name]
        }
    }
    return new Proxy(node, handler)
}

export function isNullOrEmpty(str) {
    if (str == null || str == "") {
        return true
    }
    return false
}

export function mergeConcat(a, b) {
    for (const [k, v] of Object.entries(b)) {
        if (!a[k]) {
            a[k] = []
        }
        a[k] = a[k].concat(v)
    }
}