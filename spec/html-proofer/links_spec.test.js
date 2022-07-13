import * as path from "path";
import {FIXTURES_DIR, run_proofer} from "../spec-helper";

describe("Links test", ()=> {
    it("fails for broken internal hash (even if the file exists)", ()=>{
        const broken_hash_external_filepath = path.join(FIXTURES_DIR, "links", "broken_hash_external_file.html")
        const proofer = run_proofer(broken_hash_external_filepath, "file")
        expect(proofer.failed_checks.last.description).toMatch("internally linking to ../images/missing_image_alt.html#asdfasfdkafl; the file exists, but the hash 'asdfasfdkafl' does not")
    })

    it("fails for broken hashes on the web when asked (even if the file exists)", ()=>{
        const broken_hash_on_the_web = path.join(FIXTURES_DIR, "links", "broken_hash_on_the_web.html")
        const proofer = run_proofer(broken_hash_on_the_web, "file")
        expect(proofer.failed_checks.first.description).toMatch(new RegExp("/but the hash 'no' does not/"))
    })

    it("passes for broken hashes on the web when ignored (even if the file exists)", ()=>{
        const broken_hash_on_the_web = path.join(FIXTURES_DIR, "links", "broken_hash_on_the_web.html")
        const proofer = run_proofer(broken_hash_on_the_web, "file", {check_external_hash: false})
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for GitHub hashes on the web when asked", ()=>{
        const github_hash = path.join(FIXTURES_DIR, "links", "github_hash.html")
        const proofer = run_proofer(github_hash, "file")
        expect(proofer.failed_checks).toEqual([])
    })

})
