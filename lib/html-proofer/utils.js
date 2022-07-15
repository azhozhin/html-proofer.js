import fs from "fs"
import * as cheerio from "cheerio"

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
    const result = cheerio.load(content, {sourceCodeLocationInfo: true}/*, false*/)
    return result
}

export function adapt_nokogiri_node(node) {
    const fun = () => {
        console.log('hello')
    }
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
                // fun()
                return null
            }
            // if (name == "content") {
            //     // fun()
            //     return null
            // }
            return target.attribs[name]
        }
    }
    return new Proxy(node, handler)
}

export function isNullOrEmpty(str){
    if (str==null || str==""){
        return true
    }
    return false
}

export function mergeConcat(a,b){
    for (const [k, v] of Object.entries(b)) {
        if (!a[k]) {
            a[k] = []
        }
        a[k] = a[k].concat(v)
    }
}