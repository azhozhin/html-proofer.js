import * as path from "path";
import {FIXTURES_DIR, make_proofer, run_proofer} from "../spec-helper";
import {HTMLProofer} from "../../lib/html-proofer";

describe("HTMLProofer", () => {
    describe("#failed_checks", () => {
        it("is an array of Failures", async () => {
            const broken_link_internal_filepath = path.join(FIXTURES_DIR, "links", "broken_link_internal.html")
            const proofer = await run_proofer(broken_link_internal_filepath, "file")
            expect(proofer.failed_checks.length).toEqual(2)
            expect(proofer.failed_checks[0].constructor.name).toEqual("Failure")
            expect(proofer.failed_checks.first.path).toEqual(broken_link_internal_filepath)
            expect(proofer.failed_checks.first.description).toEqual("internally linking to ./notreal.html, which does not exist")
            expect(proofer.failed_checks.first.line).toEqual(3)

        })
    })

    describe("#files", () => {
        it("works for directory that ends with .html", async () => {
            const folder = path.join(FIXTURES_DIR, "links", "_site/folder.html")
            const proofer = HTMLProofer.check_directory(folder)
            expect(proofer.files).toEqual([{source: folder, path: `${folder}/index.html`}])
        })
    })

    describe("#options", () => {
        it("strips out undesired Typhoeus options", async () => {
            const folder = path.join(FIXTURES_DIR, "links", "_site/folder.html")
            const proofer = HTMLProofer.check_file(folder, {verbose: true})
            expect(proofer.options["verbose"]).toEqual(true)
            expect(proofer.options["typhoeus"]["verbose"]).toEqual(null)
        })

        it("takes options for Parallel", async () => {
            const folder = path.join(FIXTURES_DIR, "links", "_site/folder.html")
            const proofer = HTMLProofer.check_file(folder, {parallel: {in_processes: 3}})
            expect(proofer.options["parallel"]["in_processes"]).toEqual(3)
            expect(proofer.options["typhoeus"]["in_processes"]).toBeNull()
        })

        it("only has one UA with file", async () => {
            const github_hash = path.join(FIXTURES_DIR, "links", "github_hash.html")
            const http = capture_proofer_http(github_hash, "file", {
                typhoeus: {
                    verbose: true,
                    headers: {"User-Agent": "Mozilla/5.0 (compatible; My New User-Agent)"}
                }
            })
            expect(http["request"]["headers"]["User-Agent"]).toEqual(["Mozilla/5.0 (compatible; My New User-Agent)"])
        })
    })

    describe("file ignores", () => {
        it("knows how to ignore a file by string", async () => {
            const options = {ignore_files: [path.join(FIXTURES_DIR, "links", "broken_hash_internal.html")]}
            const broken_hash_internal_filepath = path.join(FIXTURES_DIR, "links", "broken_hash_internal.html")
            const proofer = run_proofer(broken_hash_internal_filepath, "file", options)
            expect(proofer.failed_checks).toEqual([])
        })

        it("knows how to ignore a file by regexp", async () => {
            const options = {ignore_files: [/broken_hash/]}
            const broken_hash_internal_filepath = path.join(FIXTURES_DIR, "links", "broken_hash_internal.html")
            const proofer = run_proofer(broken_hash_internal_filepath, "file", options)
            expect(proofer.failed_checks).toEqual([])
        })

        it("knows how to ignore multiple files by regexp", async () => {
            const options = {ignore_files: [/.*\/javadoc\/.*/, /.*\/catalog\/.*/]}
            const broken_folders = path.join(FIXTURES_DIR, "links", "folder/multiples")
            const proofer = run_proofer([broken_folders], "directories", options)
            expect(proofer.failed_checks).toEqual([])
        })

        it("knows how to ignore a directory by regexp", async () => {
            const options = {ignore_files: [/\S\.html/]}
            const links_dir = path.join(FIXTURES_DIR, "links")
            const proofer = run_proofer([links_dir], "directories", options)
            expect(proofer.failed_checks).toEqual([])
        })
    })

    describe("ignored checks", () => {
        it("knows how to ignore checks", async () => {
            const options = {checks_to_ignore: ["ImageRunner"]}
            const proofer = make_proofer(path.join(FIXTURES_DIR, "links", "broken_link_external.html"), "file", options)
            expect(proofer.checks).not.stringContaining("ImageRunner")
        })

        it("does not care about phoney ignored checks", async () => {
            const options = {checks_to_ignore: ["This is nothing."]}
            const proofer = make_proofer(path.join(FIXTURES_DIR, "links", "broken_link_external.html"), "file", options)
            expect(proofer.checks.length).toEqual(3)
        })
    })

    describe("external links", () => {
        it("ignores status codes when asked", async () => {
            const options = {ignore_status_codes: [404]}
            const proofer = run_proofer(["www.github.com/github/notreallyhere"], 'links', options)
            expect(proofer.failed_checks.length).toEqual(0)
        })
    })

    describe("multiple directories", () => {
        it("works", async () => {
            const dirs = [path.join(FIXTURES_DIR, "links"), path.join(FIXTURES_DIR, "images")]
            const output = capture_proofer_output(dirs, "directories")

            expect(output).toMatch(path.join(FIXTURES_DIR, "links"))
            expect(output).toMatch(path.join(FIXTURES_DIR, "images"))
        })
    })
})
