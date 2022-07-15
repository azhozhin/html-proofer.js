import {Runner} from "../../lib/html-proofer/runner";
import {create_nokogiri} from "../../lib/html-proofer/utils";
import * as path from "path";
import {FIXTURES_DIR, run_proofer} from "../spec-helper";
import {Element} from "../../lib/html-proofer/element";

describe("HTMLProofer::Element", () => {

    let context = {runner: null}

    beforeEach(() => {
        context.runner = new Runner('')
        //# @check = HTMLProofer::Check.new('', '', Nokogiri::HTML5(''), nil, nil, HTMLProofer::Configuration::PROOFER_DEFAULTS)
    })

    describe("#initialize", () => {

        it("accepts the xmlns attribute", () => {
            const nokogiri = create_nokogiri('<a xmlns:cc="http://creativecommons.org/ns#">Creative Commons</a>')
            const element = new Element(context.runner, nokogiri.css("a")[0])
            expect(element.node["xmlns:cc"]).toEqual("http://creativecommons.org/ns#")
        })

        it("assigns the text node", () => {
            const nokogiri = create_nokogiri("<p>One")
            const element = new Element(context.runner, nokogiri.css("p")[0])
            expect(element.node.text).toEqual("One")
            expect(element.node.content).toEqual("One")
        })

        it("accepts the content attribute", () => {
            const nokogiri = create_nokogiri('<meta name="twitter:card" content="summary">')
            const element = new Element(context.runner, nokogiri.css("meta")[0])
            expect(element.node["content"]).toEqual("summary")
        })

    })

    describe("#link_attribute", () => {
        it("works for src attributes", () => {
            const nokogiri = create_nokogiri("<img src=image.png />")
            const element = new Element(context.runner, nokogiri.css("img")[0])
            expect(element.url.toString()).toEqual("image.png")

        })
    })

    describe("#ignore", () => {
        it("works for twitter cards", () => {
            const nokogiri = create_nokogiri('<meta name="twitter:url" data-proofer-ignore content="http://example.com/soon-to-be-published-url">')
            const element = new Element(context.runner, nokogiri.css("meta")[0])
            expect(element.ignore()).toEqual(true)
        })

    })

    describe("ivar setting", () => {
        it("does not explode if given a bad attribute", () => {
            const broken_attribute = path.join(FIXTURES_DIR, "html", "invalid_attribute.html")
            const proofer = run_proofer(broken_attribute, 'file')
            expect(proofer.failed_checks.length).toEqual(0)
        })
    })

})
