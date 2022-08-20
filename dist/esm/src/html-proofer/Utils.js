import fs from 'fs';
import * as cheerio from 'cheerio';
import URI from 'urijs';
export function isFile(filepath) {
    try {
        return fs.lstatSync(filepath).isFile();
    }
    catch (err) {
        return false;
    }
}
export function isDirectory(filepath) {
    try {
        return fs.lstatSync(filepath).isDirectory();
    }
    catch (err) {
        return false;
    }
}
export function pluralize(count, single, plural) {
    return `${count} ${count === 1 ? single : plural}`;
}
export function createDocument(src) {
    let content;
    if (fs.existsSync(src) && !isDirectory(src)) {
        content = fs.readFileSync(src);
    }
    else {
        content = src;
    }
    // we need to serialize html after cheerio to make valid dom for xml manipulations
    const $ = cheerio.load(content, { sourceCodeLocationInfo: true } /*, false*/);
    // simulation of nokogiri API
    return {
        css: (selector) => {
            const result = [];
            $(selector).each((i, node) => {
                result.push(adapt_nokogiri_node($, node));
            });
            return result;
        },
        content: $.html(),
        text: $.text(),
        // API to remove nodes from DOM
        remove: (node) => {
            $(node.nativeNode).remove();
        },
    };
}
function getContent($, node) {
    // we need to decide if it is empty or null, cheerio does not distinguish them
    if (node.children.length === 0) {
        if (node.name === 'script') { // for self-closed script endIndex == startIndex <-- looks like a bug
            return node.endIndex - node.startIndex === 0 ? null : '';
        }
        else if (node.name === 'meta') { // for meta 'content is null always if 'content' is not attribute
            return null;
        }
        return ''; // for everything else we return empty string
    }
    return $(node).html();
}
function adapt_nokogiri_node($, node) {
    return {
        name: node.name,
        // todo: this could be performance issue
        parent: (node.parent != null) ? adapt_nokogiri_node($, node.parent) : null,
        attributes: node.attribs,
        text: $(node).text(),
        content: getContent($, node),
        // technical details from parser
        sourceCodeLocation: node.sourceCodeLocation,
        nativeNode: node,
    };
}
export function isNullOrEmpty(str) {
    return str == null || str === '';
}
export function mergeConcat(a, b) {
    for (const [k, v] of b) {
        if (!a.has(k)) {
            a.set(k, []);
        }
        a.set(k, a.get(k).concat(v));
    }
}
export function joinUrl(baseUrl, url) {
    let theUrl = URI(url);
    if (theUrl.is('relative')) {
        theUrl = theUrl.absoluteTo(baseUrl);
    }
    return theUrl.toString();
}
export function hasUnicode(str) {
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127) {
            return true;
        }
    }
    return false;
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
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        }
        else {
            collection.push(item);
        }
    });
    return map;
}
// Simulation of Ruby
export function last(arr) {
    if (arr.length === 0) {
        return null;
    }
    return arr[arr.length - 1];
}
export function first(arr) {
    if (arr.length === 0) {
        return null;
    }
    return arr[0];
}
export function unique(arr) {
    return [...new Set(arr)];
}
