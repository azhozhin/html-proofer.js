import {Runner} from "../../../lib/html-proofer/runner";
import {Url} from "../../../lib/html-proofer/attribute/url";

describe("HTMLProofer::Attribute::Url", () => {
    let context = {};

    beforeEach(() => {
        context.runner = new Runner()
    })

    describe("#ignores_pattern_check", () => {
        it("works for regex patterns", () => {
            context.runner.options['ignore_urls'] = [/\/assets\/.*(js|css|png|svg)/]
            const url = new Url(context.runner, "/assets/main.js")
            expect(url.ignore()).toBeTruthy()
        })

        it("works for string patterns", () => {
            context.runner.options['ignore_urls'] = ["/assets/main.js"]
            const url = new Url(context.runner, "/assets/main.js")
            expect(url.ignore()).toBeTruthy()
        })
    })
})