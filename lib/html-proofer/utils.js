import fs from "fs"
import * as cheerio from "cheerio"

export function pluralize(count, single, plural) {
    return `${count} ${count == 1 ? single : plural}`
}

export function create_nokogiri(fullpath){
    let content
    if (fs.existsSync(fullpath) /*&& !File.directory?(path)*/){
        content = fs.readFileSync(fullpath)
    } else {
        content = fullpath
    }
    return cheerio.load(content, {sourceCodeLocationInfo: true})
}

