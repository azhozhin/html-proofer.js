import * as path from "path";
import {FIXTURES_DIR, run_proofer} from "../spec-helper";

describe("Links test", () => {
    it("fails for broken internal hash (even if the file exists)", () => {
        const broken_hash_external_filepath = path.join(FIXTURES_DIR, "links", "broken_hash_external_file.html")
        const proofer = run_proofer(broken_hash_external_filepath, "file")
        expect(proofer.failed_checks.last.description).toMatch("internally linking to ../images/missing_image_alt.html#asdfasfdkafl; the file exists, but the hash 'asdfasfdkafl' does not")
    })

    it("fails for broken hashes on the web when asked (even if the file exists)", () => {
        const broken_hash_on_the_web = path.join(FIXTURES_DIR, "links", "broken_hash_on_the_web.html")
        const proofer = run_proofer(broken_hash_on_the_web, "file")
        expect(proofer.failed_checks.first.description).toMatch(/but the hash 'no' does not/)
    })

    it("passes for broken hashes on the web when ignored (even if the file exists)", () => {
        const broken_hash_on_the_web = path.join(FIXTURES_DIR, "links", "broken_hash_on_the_web.html")
        const proofer = run_proofer(broken_hash_on_the_web, "file", {check_external_hash: false})
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for GitHub hashes on the web when asked", () => {
        const github_hash = path.join(FIXTURES_DIR, "links", "github_hash.html")
        const proofer = run_proofer(github_hash, "file")
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for GitHub hashes to a file on the web when asked", () => {
        const github_hash = path.join(FIXTURES_DIR, "links", "github_file_hash.html")
        const proofer = run_proofer(github_hash, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for broken hashes on the web (when we look only for 4xx)", () => {
        const options = {only_4xx: true}
        const broken_hash_on_the_web = path.join(FIXTURES_DIR, "links", "broken_hash_on_the_web.html")
        const proofer = run_proofer(broken_hash_on_the_web, 'file', options)
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for broken internal hash", () => {
        const broken_hash_internal_filepath = path.join(FIXTURES_DIR, "links", "broken_hash_internal.html")
        const proofer = run_proofer(broken_hash_internal_filepath, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/internally linking to #noHash; the file exists, but the hash 'noHash' does not/)
    })

    it("finds internal hash with implict index", () => {
        const broken_hash_internal_filepath = path.join(FIXTURES_DIR, "links", "implicit_internal")
        const proofer = run_proofer(broken_hash_internal_filepath, 'directory')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails to find internal hash with implict index if not asked to follow", () => {
        const options = {typhoeus: {followlocation: false}}
        const broken_hash_internal_filepath = path.join(FIXTURES_DIR, "links", "implicit_internal")
        const proofer = run_proofer(broken_hash_internal_filepath, 'directory', options)
        expect(proofer.failed_checks.length).toEqual(1)
        expect(proofer.failed_checks.first.description).toMatch(/without trailing slash/)
    })


    it("passes when linking to the top", () => {
        const top_hash_internal_filepath = path.join(FIXTURES_DIR, "links", "topHashInternal.html")
        const proofer = run_proofer(top_hash_internal_filepath, 'file')
        expect(proofer.failed_checks).toEqual([])
    })


    it("fails for broken external links", () => {
        const broken_link_external_filepath = path.join(FIXTURES_DIR, "links", "broken_link_external.html")
        const proofer = run_proofer(broken_link_external_filepath, 'file')
        const failure = proofer.failed_checks.first.description
        expect(failure).toMatch(new RegExp(/failed with something very wrong/))
    })

    it("passes for different filename without option", () => {
        const broken_link_external_filepath = path.join(FIXTURES_DIR, "links", "file.foo")
        const proofer = run_proofer(broken_link_external_filepath, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for different filenames", () => {
        const options = {extensions: [".foo"]}
        const broken_link_external_filepath = path.join(FIXTURES_DIR, "links", "file.foo")
        const proofer = run_proofer(broken_link_external_filepath, 'file', options)
        expect(proofer.failed_checks.first.description).toMatch(/failed with something very wrong/)
    })

    it("accepts multiple filenames", () => {
        const options = {extensions: [".xhtml", ".foo"]}
        const broken_link_external_filepath = path.join(FIXTURES_DIR, "links")
        const proofer = run_proofer(broken_link_external_filepath, 'directory', options)
        const results = proofer.failed_checks
            .map(x => x.path)
            .reduce((prev, current) => prev && (current.endsWith(".xhtml") || current.endsWith(".foo")), true)
        expect(results).toBeTruthy()
    })

    it("fails for broken internal links", () => {
        const broken_link_internal_filepath = path.join(FIXTURES_DIR, "links", "broken_link_internal.html")
        const proofer = run_proofer(broken_link_internal_filepath, 'file')
        expect(proofer.failed_checks.first.description).toMatch("internally linking to ./notreal.html, which does not exist")
    })

    it("fails for broken internal root links", () => {
        const broken_root_link_internal_filepath = path.join(FIXTURES_DIR, "links", "broken_root_link_internal.html")
        const proofer = run_proofer(broken_root_link_internal_filepath, 'file')
        expect(proofer.failed_checks.first.description).toMatch('internally linking to /broken_root_link_internalz.html, which does not exist')
    })

    it("succeeds for working internal root links", () => {
        const broken_root_link_internal_filepath = path.join(FIXTURES_DIR, "links", "working_root_link_internal.html")
        const proofer = run_proofer(broken_root_link_internal_filepath, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("succeeds for working internal-root-links pointing to other folder", () => {
        const broken_root_link_internal_filepath = path.join(FIXTURES_DIR, "links", "link_to_another_folder.html")
        const proofer = run_proofer(broken_root_link_internal_filepath, 'file', {root_dir: "spec/html-proofer/fixtures"})
        expect(proofer.failed_checks).toEqual([])
    })

    it("allows link with no href", () => {
        const missing_link_href_filepath = path.join(FIXTURES_DIR, "links", "missing_link_href.html")
        const proofer = run_proofer(missing_link_href_filepath, 'file', {allow_missing_href: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("should follow redirects", () => {
        const link_with_redirect_filepath = path.join(FIXTURES_DIR, "links", "link_with_redirect.html")
        const proofer = run_proofer(link_with_redirect_filepath, 'file', {enforce_https: false})
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails on redirects if not following", () => {
        const link_with_redirect_filepath = path.join(FIXTURES_DIR, "links", "link_with_redirect.html")
        const proofer = run_proofer(link_with_redirect_filepath, 'file',
            {enforce_https: false, typhoeus: {followlocation: false}})
        expect(proofer.failed_checks.first.description).toMatch(new RegExp(/failed/))
    })

    it("does not fail on redirects we're not following", () => {
        // this test should emit a 301--see above--but we're intentionally suppressing it
        const link_with_redirect_filepath = path.join(FIXTURES_DIR, "links", "link_with_redirect.html")
        const proofer = run_proofer(link_with_redirect_filepath, 'file',
            {only_4xx: true, enforce_https: false, typhoeus: {followlocation: false}})
        expect(proofer.failed_checks).toEqual([])
    })

    it("should understand https", () => {
        const link_with_https_filepath = path.join(FIXTURES_DIR, "links", "link_with_https.html")
        const proofer = run_proofer(link_with_https_filepath, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for broken hash links with status code numbers", () => {
        const broken_link_with_number_filepath = path.join(FIXTURES_DIR, "links", "broken_link_with_number.html")
        const proofer = run_proofer(broken_link_with_number_filepath, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/internally linking to #25-method-not-allowed; the file exists, but the hash '25-method-not-allowed' does not/)
    })

    it("should understand relative hash", () => {
        const link_with_https_filepath = path.join(FIXTURES_DIR, "links", "relative_hash.html")
        const proofer = run_proofer(link_with_https_filepath, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("properly resolves implicit /index.html in link paths", () => {
        const link_to_folder = path.join(FIXTURES_DIR, "links", "link_to_folder.html")
        const proofer = run_proofer(link_to_folder, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("properly checks links to root", () => {
        const root_link = path.join(FIXTURES_DIR, "links", "root_link/root_link.html")
        const proofer = run_proofer(root_link, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("properly checks relative links", () => {
        const relative_links = path.join(FIXTURES_DIR, "links", "relative_links.html")
        const proofer = run_proofer(relative_links, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("properly checks ssl links", () => {
        const check_ssl_links = path.join(FIXTURES_DIR, "links", "checkSSLLinks.html")
        const proofer = run_proofer(check_ssl_links, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores links marked as ignore data-proofer-ignore", () => {
        const ignorable_links = path.join(FIXTURES_DIR, "links", "ignorable_links.html")
        const proofer = run_proofer(ignorable_links, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores links via ignore_urls", () => {
        const opts = {ignore_urls: [/^http:\/\//, /sdadsad/, "../whaadadt.html"]}
        const ignorable_links = path.join(FIXTURES_DIR, "links", "ignorable_links_via_options.html")
        const proofer = run_proofer(ignorable_links, 'file', opts)
        expect(proofer.failed_checks).toEqual([])
    })

    it("translates links via swap_urls", () => {
        const translated_link = path.join(FIXTURES_DIR, "links", "link_translated_via_href_swap.html")
        const proofer = run_proofer(translated_link, 'file', {swap_urls: {'\A/articles/([\w-]+)': '\\1.html'}})
        expect(proofer.failed_checks).toEqual([])
    })

    it("translates links via swap_urls for list of links", () => {
        const proofer = run_proofer(["www.garbalarba.com"], 'links', {swap_urls: {'/garbalarba/': "github"}})
        expect(proofer.failed_checks).toEqual([])
    })

    it("finds a mix of broken and unbroken links", () => {
        const multiple_problems = path.join(FIXTURES_DIR, "links", "multiple_problems.html")
        const proofer = run_proofer(multiple_problems, 'file')
        expect(proofer.failed_checks.first.description).toMatch("internally linking to #anadaasdadsadschor; the file exists, but the hash 'anadaasdadsadschor' does not")
    })

    it("finds the same broken link multiple times", () => {
        const multiple_problems = path.join(FIXTURES_DIR, "links", "multiple_links.html")
        const proofer = run_proofer(multiple_problems, 'file')
        expect(proofer.failed_checks.length).toEqual(3)
    })

    it("ignores valid mailto links", () => {
        const ignorable_links = path.join(FIXTURES_DIR, "links", "mailto_link.html")
        const proofer = run_proofer(ignorable_links, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores blank mailto links when configured to allow them", () => {
        const blank_mail_to_link = path.join(FIXTURES_DIR, "links", "blank_mailto_link.html")
        const proofer = run_proofer(blank_mail_to_link, 'file', {ignore_empty_mailto: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for blank mailto links", () => {
        const blank_mail_to_link = path.join(FIXTURES_DIR, "links", "blank_mailto_link.html")
        const proofer = run_proofer(blank_mail_to_link, 'file')
        expect(proofer.failed_checks.first.description).toMatch("mailto: contains no email address")
    })

    it("fails for invalid mailto links", () => {
        const invalid_mail_to_link = path.join(FIXTURES_DIR, "links", "invalid_mailto_link.html")
        const proofer = run_proofer(invalid_mail_to_link, 'file')
        expect(proofer.failed_checks.first.description).toMatch('mailto:octocat contains an invalid email address')
    })

    it("ignores valid tel links", () => {
        const ignorable_links = path.join(FIXTURES_DIR, "links", "tel_link.html")
        const proofer = run_proofer(ignorable_links, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for blank tel links", () => {
        const blank_tel_link = path.join(FIXTURES_DIR, "links", "blank_tel_link.html")
        const proofer = run_proofer(blank_tel_link, 'file')
        expect(proofer.failed_checks.first.description).toMatch("tel: contains no phone number")
    })

    it("ignores javascript links", () => {
        const javascript_link = path.join(FIXTURES_DIR, "links", "javascript_link.html")
        const proofer = run_proofer(javascript_link, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("works for valid links missing the protocol", () => {
        const missing_protocol_link = path.join(FIXTURES_DIR, "links", "link_missing_protocol_valid.html")
        const proofer = run_proofer(missing_protocol_link, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for invalid links missing the protocol", () => {
        const missing_protocol_link = path.join(FIXTURES_DIR, "links", "link_missing_protocol_invalid.html")
        const proofer = run_proofer(missing_protocol_link, 'file')
        expect(proofer.failed_checks.first.description).toMatch("failed with something very wrong")
    })

    it("works for valid href within link elements", () => {
        const head_link = path.join(FIXTURES_DIR, "links", "head_link_href.html")
        const proofer = run_proofer(head_link, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("allows empty href on link elements", () => {
        const head_link = path.join(FIXTURES_DIR, "links", "head_link_href_empty.html")
        const proofer = run_proofer(head_link, 'file', {allow_missing_href: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("allows missing href on link elements", () => {
        const head_link = path.join(FIXTURES_DIR, "links", "head_link_href_absent.html")
        const proofer = run_proofer(head_link, 'file', {allow_missing_href: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("allows for internal linking to a directory without trailing slash by default", () => {
        const internal = path.join(FIXTURES_DIR, "links", "link_directory_without_slash.html")
        const proofer = run_proofer(internal, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for internal linking to a directory without trailing slash", () => {
        const options = {typhoeus: {followlocation: false}}
        const internal = path.join(FIXTURES_DIR, "links", "link_directory_without_slash.html")
        const proofer = run_proofer(internal, 'file', options)
        expect(proofer.failed_checks.first.description).toMatch(/without trailing slash/)
    })

    it("ignores external links when asked", () => {
        const options = {disable_external: true}
        const external = path.join(FIXTURES_DIR, "links", "broken_link_external.html")
        const proofer = run_proofer(external, 'file', options)
        expect(proofer.failed_checks).toEqual([])
    })

    it("validates links with external characters", () => {
        const options = {disable_external: true}
        const external = path.join(FIXTURES_DIR, "links", "external_colon_link.html")
        const proofer = run_proofer(external, 'file', options)
        expect(proofer.failed_checks).toEqual([])
    })

    it("works for array of links", () => {
        const proofer = run_proofer(["www.github.com", "foofoofoo.biz"], 'links')
        expect(proofer.failed_checks.first.description).toMatch(/failed with something very wrong/)
    })

    it("works for broken anchors within pre", () => {
        const anchor_pre = path.join(FIXTURES_DIR, "links", "anchors_in_pre.html")
        const proofer = run_proofer(anchor_pre, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("works for broken link within pre", () => {
        const link_pre = path.join(FIXTURES_DIR, "links", "links_in_pre.html")
        const proofer = run_proofer(link_pre, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("works for pipes in the URL", () => {
        const escape_pipes = path.join(FIXTURES_DIR, "links", "escape_pipes.html")
        const proofer = run_proofer(escape_pipes, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for broken hash with query", () => {
        const broken_hash = path.join(FIXTURES_DIR, "links", "broken_hash_with_query.html")
        const proofer = run_proofer(broken_hash, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/#example; the file exists, but the hash 'example' does not/)
    })

    it("passes when linking to hash on another page", () => {
        const hash_on_another_page = path.join(FIXTURES_DIR, "links", "hash_on_another_page.html")
        const proofer = run_proofer(hash_on_another_page, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails for mismatched hash casing", () => {
        const hash_on_another_page = path.join(FIXTURES_DIR, "links", "hash_mismatched_case.html")
        const proofer = run_proofer(hash_on_another_page, 'file')
        expect(proofer.failed_checks.first.description).toMatch("#MainMenu; the file exists, but the hash 'MainMenu' does not")
    })

    it("works for directory index file", () => {
        const options = {directory_index_file: "index.php"}
        const link_pointing_to_directory = path.join(FIXTURES_DIR, "links", "link_pointing_to_directory.html")
        const proofer = run_proofer(link_pointing_to_directory, 'file', options)
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails if directory index file doesn't exist", () => {
        const options = {directory_index_file: "README.md"}
        const link_pointing_to_directory = path.join(FIXTURES_DIR, "links", "link_pointing_to_directory.html")
        const proofer = run_proofer(link_pointing_to_directory, 'file', options)
        expect(proofer.failed_checks.first.description).toMatch("internally linking to folder-php/, which does not exist")
    })

    it("ensures Typhoeus options are passed", () => {
        const options = {typhoeus: {ssl_verifypeer: false}}
        const typhoeus_options_link = path.join(FIXTURES_DIR, "links", "ensure_typhoeus_options.html")
        const proofer = run_proofer(typhoeus_options_link, 'file', options)
        expect(proofer.failed_checks).toEqual([])
    })

    it("works if subdirectory }s with .html", () => {
        const with_subdirectory_html = path.join(FIXTURES_DIR, "links", "_site")
        const proofer = run_proofer(with_subdirectory_html, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("works for hash referring to itself", () => {
        const hash_referring_to_self = path.join(FIXTURES_DIR, "links", "hash_referring_to_self.html")
        const proofer = run_proofer(hash_referring_to_self, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores placeholder with name", () => {
        const placeholder_with_name = path.join(FIXTURES_DIR, "links", "placeholder_with_name.html")
        const proofer = run_proofer(placeholder_with_name, 'file', {allow_missing_href: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores placeholder with id", () => {
        const placeholder_with_id = path.join(FIXTURES_DIR, "links", "placeholder_with_id.html")
        const proofer = run_proofer(placeholder_with_id, 'file', {allow_missing_href: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("allows placeholder with empty id", () => {
        const empty_id = path.join(FIXTURES_DIR, "links", "placeholder_with_empty_id.html")
        const proofer = run_proofer(empty_id, 'file', {allow_missing_href: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores non-http(s) protocols", () => {
        const other_protocols = path.join(FIXTURES_DIR, "links", "other_protocols.html")
        const proofer = run_proofer(other_protocols, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes non-standard characters", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "non_standard_characters.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("does not dupe errors", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "nodupe.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks.length).toEqual(1)
    })

    it("allows unicode domains", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "unicode_domain.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("allows punnycode domains", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "punnycode.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for broken *nix links", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "broken_unix_links.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for external UTF-8 links", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "utf8_link.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for urlencoded href", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "urlencoded-href.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("reports failures for the original link, not the redirection", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "redirected_error.html")
        const proofer = run_proofer(fixture, 'file', {enforce_https: false})
        expect(proofer.failed_checks.first.description).toMatch("http://stackoverflow.com/asdadsads failed")
    })

    it("does not complain for files with attributes containing dashes", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "attribute_with_dash.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("passes for links hash-referencing itself", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "self_ref.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    describe("automatically adding default extensions to files", () => {
        let context = {fixture: null}

        beforeEach(() => {
            context.fixture = path.join(FIXTURES_DIR, "links", "no_html_extension.html")
        })

        it("can be turned off", () => {
            // Default behaviour does not change
            const proofer = run_proofer(context.fixture, 'file', {assume_extension: ""})
            expect(proofer.failed_checks.length).toBeGreaterThanOrEqual(3)
        })

        it("accepts extensionless file links by default", () => {
            // With command-line option
            const proofer = run_proofer(context.fixture, 'file')
            expect(proofer.failed_checks).toEqual([])
        })
    })

    it("does check links with parameters multiple times", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "check_just_once.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.external_urls.length).toEqual(4)
    })

    it("does not explode on bad external links in files", () => {
        const fixture = path.join(FIXTURES_DIR, "links", "bad_external_links.html")
        const proofer = run_proofer(fixture, 'file')
        expect(proofer.failed_checks.length).toEqual(2)
        expect(proofer.failed_checks.first.description).toMatch(/is an invalid URL/)
    })

    it("does not explode on bad external links in arrays", () => {
        const proofer = run_proofer(["www.github.com", "http://127.0.0.1:____"], 'links')
        expect(proofer.failed_checks.first.description).toMatch(/is an invalid URL/)
    })

    it("passes for non-HTTPS links when asked", () => {
        const non_https = path.join(FIXTURES_DIR, "links", "non_https.html")
        const proofer = run_proofer(non_https, 'file', {enforce_https: false})
        expect(proofer.failed_checks.length).toEqual(0)
    })

    it("fails for non-HTTPS links by default", () => {
        const non_https = path.join(FIXTURES_DIR, "links", "non_https.html")
        const proofer = run_proofer(non_https, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/ben.balter.com is not an HTTPS link/)
    })

    it("passes for hash href", () => {
        const hash_href = path.join(FIXTURES_DIR, "links", "hash_href.html")
        const proofer = run_proofer(hash_href, 'file')
        expect(proofer.failed_checks.length).toEqual(0)
    })

    it("fails for hash href when asked", () => {
        const hash_href = path.join(FIXTURES_DIR, "links", "hash_href.html")
        const proofer = run_proofer(hash_href, 'file', {allow_hash_href: false})
        expect(proofer.failed_checks.first.description).toMatch(/linking to internal hash #, which points to nowhere/)
    })

    it("fails for broken IP address links", () => {
        const hash_href = path.join(FIXTURES_DIR, "links", "ip_href.html")
        const proofer = run_proofer(hash_href, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/failed with something very wrong/)
    })

    it("works for internal links to weird encoding IDs", () => {
        const hash_href = path.join(FIXTURES_DIR, "links", "encodingLink.html")
        const proofer = run_proofer(hash_href, 'file')
        expect(proofer.failed_checks.length).toEqual(0)
    })

    // even though this is valid in HTML5, flag it as an error because it's
    // possibly a mistake
    it("does expect href for anchors in HTML5", () => {
        const missing_href = path.join(FIXTURES_DIR, "links", "blank_href_html5.html")
        const proofer = run_proofer(missing_href, 'file')
        expect(proofer.failed_checks.length).toEqual(1)
    })

    it("does expect href for anchors in non-HTML5", () => {
        let missing_href = path.join(FIXTURES_DIR, "links", "blank_href_html4.html")
        let proofer = run_proofer(missing_href, 'file')
        expect(proofer.failed_checks.length).toEqual(1)

        missing_href = path.join(FIXTURES_DIR, "links", "blank_href_htmlunknown.html")
        proofer = run_proofer(missing_href, 'file')
        expect(proofer.failed_checks.length).toEqual(1)
    })

    it("can skip expecting href for anchors in non-HTML5", () => {
        let missing_href = path.join(FIXTURES_DIR, "links", "blank_href_html4.html")
        let proofer = run_proofer(missing_href, 'file', {allow_missing_href: true})
        expect(proofer.failed_checks.length).toEqual(0)

        missing_href = path.join(FIXTURES_DIR, "links", "blank_href_htmlunknown.html")
        proofer = run_proofer(missing_href, 'file', {allow_missing_href: true})
        expect(proofer.failed_checks.length).toEqual(0)
    })

    it("passes for relative links with a base", () => {
        const relative_links = path.join(FIXTURES_DIR, "links", "relative_links_with_base.html")
        const proofer = run_proofer(relative_links, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("does not bomb on dns-prefetch", () => {
        const prefetch = path.join(FIXTURES_DIR, "links", "dns-prefetch.html")
        const proofer = run_proofer(prefetch, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("ignores links when the parent element is ignored", () => {
        const parent_ignore = path.join(FIXTURES_DIR, "links", "ignored_by_parent.html")
        const proofer = run_proofer(parent_ignore, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("does not cgi encode link", () => {
        const prefetch = path.join(FIXTURES_DIR, "links", "do_not_cgi_encode.html")
        const proofer = run_proofer(prefetch, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("works with quotes in the hash href", () => {
        const hash_href = path.join(FIXTURES_DIR, "links", "quote.html")
        const proofer = run_proofer(hash_href, 'file', {allow_hash_href: true})
        expect(proofer.failed_checks.length).toEqual(0)
    })

    it("works with base without href", () => {
        const base_no_href = path.join(FIXTURES_DIR, "links", "base_no_href.html")
        const proofer = run_proofer(base_no_href, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("complains if SRI and CORS not provided", () => {
        const file = path.join(FIXTURES_DIR, "links", "integrity_and_cors_not_provided.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks.first.description).toMatch(/SRI and CORS not provided/)
    })

    it("complains if SRI not provided", () => {
        const file = path.join(FIXTURES_DIR, "links", "cors_not_provided.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks.first.description).toMatch(/CORS not provided/)
    })

    it("complains if CORS not provided", () => {
        const file = path.join(FIXTURES_DIR, "links", "integrity_not_provided.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks.first.description).toMatch(/Integrity is missing/)
    })

    it("is happy if SRI and CORS provided", () => {
        const file = path.join(FIXTURES_DIR, "links", "integrity_and_cors_provided.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("does not check sri for pagination", () => {
        const file = path.join(FIXTURES_DIR, "links", "integrity_and_cors_pagination_rels.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("does not check local scripts", () => {
        const file = path.join(FIXTURES_DIR, "links", "local_stylesheet.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("handles timeout", () => {
        const proofer = run_proofer(["https://www.sdskafnlkn3rl3204uasfilfkmakmefalkm.com:81"], 'links')
        expect(proofer.failed_checks.first.description).toMatch(/got a time out|the request timed out/)
    })

    it("correctly handles empty href", () => {
        const file = path.join(FIXTURES_DIR, "links", "empty_href.html")
        const proofer = run_proofer(file, 'file')
        expect(proofer.failed_checks.length).toEqual(1)
    })

    it("is not checking SRI and CORS for links with rel canonical or alternate", () => {
        const file = path.join(FIXTURES_DIR, "links", "link_with_rel.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it('is not checking SRI and CORS for indieweb links with rel "me", "webmention", or "pingback"', () => {
        const file = path.join(FIXTURES_DIR, "links", "link_with_me.html")
        const proofer = run_proofer(file, 'file', {check_sri: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("can link to external non-unicode hash", () => {
        const file = path.join(FIXTURES_DIR, "links", "hash_to_unicode_ref.html")
        const proofer = run_proofer(file, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("allows for at-sign attribute", () => {
        const file = path.join(FIXTURES_DIR, "links", "at_sign.html")
        const proofer = run_proofer(file, 'file', {allow_hash_href: false})
        expect(proofer.failed_checks.first.description).toMatch(/linking to internal hash/)
    })

    it("allows for at-sign attribute to be ignored", () => {
        const file = path.join(FIXTURES_DIR, "links", "at_sign_ignorable.html")
        const proofer = run_proofer(file, 'file')
        expect(proofer.failed_checks).toEqual([])
    })

    it("checks source tags", () => {
        const file = path.join(FIXTURES_DIR, "links", "source.html")
        const proofer = run_proofer(file, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/failed/)
    })

    it("works for a direct link through directory", () => {
        const dir = path.join(FIXTURES_DIR, "links", "internals")
        const proofer = run_proofer(dir, 'directory')
        expect(proofer.failed_checks).toEqual([])
    })

    it("knows how to find internal link with additional sources", () => {
        const empty_dir = path.join(FIXTURES_DIR, "links", "same_name_as_dir")
        const valid_dir = path.join(FIXTURES_DIR, "links", "internals")
        const proofer = run_proofer([valid_dir, empty_dir], 'directories')
        expect(proofer.failed_checks.length).toEqual(0)
    })

    it("reports linked internal through directory", () => {
        const file = path.join(FIXTURES_DIR, "links", "hashes")
        const proofer = run_proofer(file, 'directory')
        expect(proofer.failed_checks.first.description).toMatch(/the file exists, but the hash 'generating-and-submitting' does not/)
    })

    it("works for hash hrefs", () => {
        const file = path.join(FIXTURES_DIR, "links", "hash/inner.html")
        const proofer = run_proofer(file, 'file', {allow_hash_href: true})
        expect(proofer.failed_checks).toEqual([])
    })

    it("fails if hash hrefs are excluded", () => {
        const file = path.join(FIXTURES_DIR, "links", "hash/inner.html")
        const proofer = run_proofer(file, 'file', {allow_hash_href: false})
        expect(proofer.failed_checks.length).toEqual(1)
    })

    it("does not crash on badly formatted urls", () => {
        const file = path.join(FIXTURES_DIR, "links", "bad_formatting.html")
        const proofer = run_proofer(file, 'file')
        expect(proofer.failed_checks.first.description).toMatch(/is an invalid URL/)
    })

    it("should not try reading PDFs", () => {
        const file = path.join(FIXTURES_DIR, "links", "pdfs.html")
        const proofer = run_proofer(file, 'file')
        expect(proofer.failed_checks.length).toEqual(3)
        expect(proofer.failed_checks.first.description).toMatch(/internally linking to exists.pdf#page=2; the file exists, but the hash 'page=2' does not/)
        expect(proofer.failed_checks.last.description).toMatch(/internally linking to missing.pdf#page=2, which does not exist/)
    })

})
