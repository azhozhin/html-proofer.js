"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unique = exports.first = exports.last = exports.groupBy = exports.hasUnicode = exports.joinUrl = exports.mergeConcat = exports.isNullOrEmpty = exports.createDocument = exports.pluralize = exports.isDirectory = exports.isFile = void 0;
const fs_1 = __importDefault(require("fs"));
const cheerio = __importStar(require("cheerio"));
const urijs_1 = __importDefault(require("urijs"));
function isFile(filepath) {
    try {
        return fs_1.default.lstatSync(filepath).isFile();
    }
    catch (err) {
        return false;
    }
}
exports.isFile = isFile;
function isDirectory(filepath) {
    try {
        return fs_1.default.lstatSync(filepath).isDirectory();
    }
    catch (err) {
        return false;
    }
}
exports.isDirectory = isDirectory;
function pluralize(count, single, plural) {
    return `${count} ${count === 1 ? single : plural}`;
}
exports.pluralize = pluralize;
function createDocument(src) {
    let content;
    if (fs_1.default.existsSync(src) && !isDirectory(src)) {
        content = fs_1.default.readFileSync(src);
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
exports.createDocument = createDocument;
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
function isNullOrEmpty(str) {
    return str == null || str === '';
}
exports.isNullOrEmpty = isNullOrEmpty;
function mergeConcat(a, b) {
    for (const [k, v] of b) {
        if (!a.has(k)) {
            a.set(k, []);
        }
        a.set(k, a.get(k).concat(v));
    }
}
exports.mergeConcat = mergeConcat;
function joinUrl(baseUrl, url) {
    let theUrl = (0, urijs_1.default)(url);
    if (theUrl.is('relative')) {
        theUrl = theUrl.absoluteTo(baseUrl);
    }
    return theUrl.toString();
}
exports.joinUrl = joinUrl;
function hasUnicode(str) {
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127) {
            return true;
        }
    }
    return false;
}
exports.hasUnicode = hasUnicode;
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
function groupBy(list, keyGetter) {
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
exports.groupBy = groupBy;
// Simulation of Ruby
function last(arr) {
    if (arr.length === 0) {
        return null;
    }
    return arr[arr.length - 1];
}
exports.last = last;
function first(arr) {
    if (arr.length === 0) {
        return null;
    }
    return arr[0];
}
exports.first = first;
function unique(arr) {
    return [...new Set(arr)];
}
exports.unique = unique;
