import * as path from "path";
import {FIXTURES_DIR, run_proofer} from "../spec-helper";
import {Favicon} from "../../lib/html-proofer/check/favicon";

describe("Favicons test", () => {
    it("ignores for absent favicon by default", () => {
        const absent = path.join(FIXTURES_DIR, "favicon", "favicon_absent.html")
        expect(run_proofer(absent, 'file').failed_checks).toEqual([])
    })

    it("fails for absent favicon", () => {
        const absent = path.join(FIXTURES_DIR, "favicon", "favicon_absent.html")
        const proofer = run_proofer(absent, 'file', {checks: [Favicon]})
        expect(proofer.failed_checks.first.description).toMatch(/no favicon provided/)
    })

    it("fails for absent favicon but present apple touch icon", () => {
        const absent = path.join(FIXTURES_DIR, "favicon", "favicon_absent_apple.html")
        const proofer = run_proofer(absent, 'file', {checks: [Favicon]})
        expect(proofer.failed_checks.last.description).toMatch(/(no favicon provided)/)
    })

    it("fails for broken internal favicon", () => {
        const broken = path.join(FIXTURES_DIR, "favicon", "internal_favicon_broken.html")
        const proofer = run_proofer(broken, 'file', {checks: [Favicon]})
        expect(proofer.failed_checks.first.description).toMatch(/internal favicon asdadaskdalsdk.png/)
    })

    it("fails for broken external favicon", () => {
        const broken = path.join(FIXTURES_DIR, "favicon", "external_favicon_broken.html")
        const proofer = run_proofer(broken, 'file', {checks: [Favicon]})
        expect(proofer.failed_checks.first.description).toMatch("External link https://www.github.com/asdadaskdalsdk.png")
    })

    it("fails for ignored with ignore_urls", () => {
        const ignored = path.join(FIXTURES_DIR, "favicon", "internal_favicon_broken.html")
        const proofer = run_proofer(ignored, 'file', {checks: [Favicon], ignore_urls: [/asdadaskdalsdk/]})
        expect(proofer.failed_checks.first.description).toMatch(/no favicon provided/)
    })

    it("translates links via swap_urls", () => {
        const opts = {
            checks: ["Favicon"],
            swap_urls: {'/^asdadaskdalsdk.+/': "../resources/gpl.png"}
        }
        const translated_link = path.join(FIXTURES_DIR, "favicon", "internal_favicon_broken.html")
        const proofer = run_proofer(translated_link, 'file', opts)
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for present favicon", () => {
        const present = path.join(FIXTURES_DIR, "favicon", "favicon_present.html")
        const proofer = run_proofer(present, 'file', {checks: [Favicon]})
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for present favicon with shortcut notation", () => {
        const present = path.join(FIXTURES_DIR, "favicon", "favicon_present_shortcut.html")
        const proofer = run_proofer(present, 'file', {checks: [Favicon]})
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for broken favicon with data-proofer-ignore", () => {
        const broken_but_ignored = path.join(FIXTURES_DIR, "favicon", "favicon_broken_but_ignored.html")
        const proofer = run_proofer(broken_but_ignored, 'file', {checks: [Favicon]})
        expect(proofer.failed_checks.first.description).toMatch(/no favicon provided/)
    })

    it("specifically ignores jekyll redirect_from template", () => {
        const broken_but_ignored = path.join(FIXTURES_DIR, "favicon", "jekyll_redirect_from.html")
        const proofer = run_proofer(broken_but_ignored, 'file', {checks: [Favicon]})
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores SRI/CORS requirements for favicons", () => {
        const file = path.join(FIXTURES_DIR, "favicon", "cors_not_needed.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks).toEqual([])
    })
})
