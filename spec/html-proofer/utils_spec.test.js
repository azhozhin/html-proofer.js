import {adapt_nokogiri_node, create_nokogiri} from "../../lib/html-proofer/utils";
import * as path from "path";
import {FIXTURES_DIR} from "../spec-helper";

describe("Utils", () => {
    describe("::create_nokogiri", () => {
        it("passes for a string", () => {
            const noko = create_nokogiri('<html lang="jp">')
            const node = adapt_nokogiri_node(noko.css("html")[0])
            expect(node["lang"]).toEqual("jp")
        })

        it("passes for a file", () => {
            const noko = create_nokogiri(path.join(FIXTURES_DIR, "utils", "lang-jp.html"))
            const node = adapt_nokogiri_node(noko.css("html")[0])
            expect(node["lang"]).toEqual("jp")
        })

        it("ignores directories", () => {
            const noko = create_nokogiri(path.join(FIXTURES_DIR, "utils"))
            expect(noko.content).toEqual(path.join("spec", "html-proofer", "fixtures", "utils"))
        })
    })
})
