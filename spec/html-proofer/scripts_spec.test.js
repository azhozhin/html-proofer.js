import {FIXTURES_DIR, run_proofer} from "../spec-helper";
import * as path from "path";

describe("Scripts test", () => {
    it("fails for broken external src", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "script_broken_external.html")
        const proofer = await run_proofer(file, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/failed with something very wrong/)
    })

    it("works for valid internal src", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "script_valid_internal.html")
        const proofer = await run_proofer(file, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for missing internal src", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "script_missing_internal.html")
        const proofer = await run_proofer(file, 'file')
        expect(proofer.failed_checks.length).to(eq(1))
        expect(proofer.failed_checks.first.description).to(include("internal script reference doesnotexist.js does not exist"))
    })

    it("works for present content", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "script_content.html")
        const proofer = await run_proofer(file, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for absent content", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "script_content_absent.html")
        const proofer = await run_proofer(file, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/script is empty and has no src attribute/)
    })

    it("works for broken script within pre", async () => {
        const script_pre = path.join(FIXTURES_DIR, "scripts", "script_in_pre.html")
        const proofer = await run_proofer(script_pre, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores links via ignore_urls", async () => {
        const ignorable_links = path.join(FIXTURES_DIR, "scripts", "ignorable_links_via_options.html")
        const proofer = await run_proofer(ignorable_links, 'file', {ignore_urls: ['/\/assets\/.*(js|css|png|svg)/']})
        expect(proofer.failed_checks).toEqual([])
    })

    it("translates src via swap_urls", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "script_abs_url.html")
        const proofer = await run_proofer(file, 'file', {swap_urls: {'/^http:\/\/example.com/': ""}})
        expect(proofer.failed_checks).toEqual([])
    })

    it("is unhappy if SRI and CORS not provided", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "integrity_and_cors_not_provided.html")
        const proofer = await run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks.first.description).toMatch(/SRI and CORS not provided/)
    })

    it("is unhappy if SRI not provided", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "cors_not_provided.html")
        const proofer = await run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks.first.description).toMatch(/CORS not provided/)
    })

    it("is unhappy if CORS not provided", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "integrity_not_provided.html")
        const proofer = await run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks.first.description).toMatch(/Integrity is missing/)
    })

    it("is happy if SRI and CORS provided", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "integrity_and_cors_provided.html")
        const proofer = await run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("does not check SRI/CORS for local scripts", async () => {
        const file = path.join(FIXTURES_DIR, "scripts", "local_script.html")
        const proofer = await run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks).toEqual([])
    })
})
