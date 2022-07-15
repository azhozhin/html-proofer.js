import {OpenGraph} from "../../lib/html-proofer/check/open_graph";
import {FIXTURES_DIR, run_proofer} from "../spec-helper";
import * as path from "path";

describe("Open Graph test", () => {
    it("passes for existing external url", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "url-valid.html")
        const proofer = run_proofer(url_valid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for missing url content attribute", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "url-missing.html")
        const proofer = run_proofer(url_valid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks.first.description).toMatch(/open graph has no content attribute/)
    })

    it("fails for empty url", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "url-empty.html")
        const proofer = run_proofer(url_valid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks.first.description).toMatch(/open graph content attribute is empty/)
    })

    it("fails for missing external url", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "url-broken.html")
        const proofer = run_proofer(url_valid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks.first.description).toMatch(/failed with something very wrong/)
    })

    it("passes for existing external image", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "image-valid.html")
        const proofer = run_proofer(url_valid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for missing image content attribute", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "image-missing.html")
        const proofer = run_proofer(url_valid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks.first.description).toMatch(/open graph has no content attribute/)
    })

    it("fails for empty image", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "image-empty.html")
        const proofer = run_proofer(url_valid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks.first.description).toMatch(/open graph content attribute is empty/)
    })

    it("fails for missing external image", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "image-broken.html")
        const proofer = run_proofer(url_valid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks.first.description).toMatch(/failed/)
    })

    it("fails for missing internal images", () => {
        const image_internal_invalid = path.join(FIXTURES_DIR, "opengraph", "image-internal-broken.html")
        const proofer = run_proofer(image_internal_invalid, 'file', {checks: [OpenGraph]})
        expect(proofer.failed_checks.first.description).toMatch(/doesnotexist.png does not exist/)
    })

    it("passes for missing external url when not asked to check", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "url-broken.html")
        const proofer = run_proofer(url_valid, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for missing external image when not asked to check", () => {
        const url_valid = path.join(FIXTURES_DIR, "opengraph", "image-broken.html")
        const proofer = run_proofer(url_valid, 'file', {check_opengraph: false})
        expect(proofer.failed_checks).toEqual([])
    })
})
