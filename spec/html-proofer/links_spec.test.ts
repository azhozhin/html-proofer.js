import * as path from 'path'
import {CheckType, IOptions, last} from '../../src'
import {FIXTURES_DIR, createAndRunProofer} from '../spec-helper'

describe('Links test', () => {
  it('fails for broken internal hash (even if the file exists)', async () => {
    const broken_hash_external_filepath = path.join(FIXTURES_DIR, 'links', 'broken_hash_external_file.html')
    const proofer = await createAndRunProofer(broken_hash_external_filepath, CheckType.FILE)
    expect(last(proofer.failedChecks).description).toMatch(
      'internally linking to ../images/missing_image_alt.html#asdfasfdkafl; the file exists, but the hash \'asdfasfdkafl\' does not')
  })

  it('fails for broken hashes on the web when asked (even if the file exists)', async () => {
    const broken_hash_on_the_web = path.join(FIXTURES_DIR, 'links', 'broken_hash_on_the_web.html')
    const proofer = await createAndRunProofer(broken_hash_on_the_web, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch(/but the hash 'no' does not/)
  })

  it('passes for broken hashes on the web when ignored (even if the file exists)', async () => {
    const broken_hash_on_the_web = path.join(FIXTURES_DIR, 'links', 'broken_hash_on_the_web.html')
    const proofer = await createAndRunProofer(broken_hash_on_the_web, CheckType.FILE, {check_external_hash: false})
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for GitHub hashes on the web when asked', async () => {
    const github_hash = path.join(FIXTURES_DIR, 'links', 'github_hash.html')
    const proofer = await createAndRunProofer(github_hash, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for GitHub hashes to a file on the web when asked', async () => {
    const githubHash = path.join(FIXTURES_DIR, 'links', 'github_file_hash.html')
    const proofer = await createAndRunProofer(githubHash, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for broken hashes on the web (when we look only for 4xx)', async () => {
    const options = {only_4xx: true}
    const brokenHashOnTheWeb = path.join(FIXTURES_DIR, 'links', 'broken_hash_on_the_web.html')
    const proofer = await createAndRunProofer(brokenHashOnTheWeb, CheckType.FILE, options)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for broken internal hash', async () => {
    const brokenHashInternalFilepath = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
    const proofer = await createAndRunProofer(brokenHashInternalFilepath, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch(/internally linking to #noHash; the file exists, but the hash 'noHash' does not/)
  })

  it('finds internal hash with implicit index', async () => {
    const brokenHashInternalFilepath = path.join(FIXTURES_DIR, 'links', 'implicit_internal')
    const proofer = await createAndRunProofer(brokenHashInternalFilepath, CheckType.DIRECTORY)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails to find internal hash with implicit index if not asked to follow', async () => {
    const options = {typhoeus: {followlocation: false}}
    const brokenHashInternalFilepath = path.join(FIXTURES_DIR, 'links', 'implicit_internal')
    const proofer = await createAndRunProofer(brokenHashInternalFilepath, CheckType.DIRECTORY, options)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/without trailing slash/)
  })

  it('passes when linking to the top', async () => {
    const topHashInternalFilepath = path.join(FIXTURES_DIR, 'links', 'topHashInternal.html')
    const proofer = await createAndRunProofer(topHashInternalFilepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for broken external links', async () => {
    const brokenLinkExternalFilepath = path.join(FIXTURES_DIR, 'links', 'broken_link_external.html')
    const proofer = await createAndRunProofer(brokenLinkExternalFilepath, CheckType.FILE)
    const failure = proofer.failedChecks[0].description
    expect(failure).toMatch(new RegExp(/failed with something very wrong/))
  })

  it('passes for different filename without option', async () => {
    const brokenLinkExternalFilepath = path.join(FIXTURES_DIR, 'links', 'file.foo')
    const proofer = await createAndRunProofer(brokenLinkExternalFilepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for different filenames', async () => {
    const options = {extensions: ['.foo']}
    const brokenLinkExternalFilepath = path.join(FIXTURES_DIR, 'links', 'file.foo')
    const proofer = await createAndRunProofer(brokenLinkExternalFilepath, CheckType.FILE, options)
    expect(proofer.failedChecks[0].description).toMatch(/failed with something very wrong/)
  })

  it('accepts multiple filenames', async () => {
    const options = {extensions: ['.xhtml', '.foo']}
    const brokenLinkExternalFilepath = path.join(FIXTURES_DIR, 'links')
    const proofer = await createAndRunProofer(brokenLinkExternalFilepath, CheckType.DIRECTORY, options)
    const results = proofer.failedChecks.map(x => x.path).reduce((prev, current) => prev && (current.endsWith('.xhtml') || current.endsWith('.foo')), true)
    expect(results).toBeTruthy()
  })

  it('fails for broken internal links', async () => {
    const brokenLinkInternalFilepath = path.join(FIXTURES_DIR, 'links', 'broken_link_internal.html')
    const proofer = await createAndRunProofer(brokenLinkInternalFilepath, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch('internally linking to ./notreal.html, which does not exist')
  })

  it('fails for broken internal root links', async () => {
    const brokenRootLinkInternalFilepath = path.join(FIXTURES_DIR, 'links', 'broken_root_link_internal.html')
    const proofer = await createAndRunProofer(brokenRootLinkInternalFilepath, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch('internally linking to /broken_root_link_internalz.html, which does not exist')
  })

  it('succeeds for working internal root links', async () => {
    const brokenRootLinkInternalFilepath = path.join(FIXTURES_DIR, 'links', 'working_root_link_internal.html')
    const proofer = await createAndRunProofer(brokenRootLinkInternalFilepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('succeeds for working internal-root-links pointing to other folder', async () => {
    const brokenRootLinkInternalFilepath = path.join(FIXTURES_DIR, 'links', 'link_to_another_folder.html')
    const proofer = await createAndRunProofer(brokenRootLinkInternalFilepath, CheckType.FILE,
      {root_dir: 'spec/html-proofer/fixtures'})
    expect(proofer.failedChecks).toEqual([])
  })

  it('succeeds for working root-link with hash', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'root_folder', 'documentation-from-my-project', 'root_link_with_hash.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {root_dir: 'spec/html-proofer/fixtures/links/root_folder'})
    expect(proofer.failedChecks).toEqual([])
  })

  it('succeeds for working root-link with hash to index', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'root_folder', 'documentation-from-my-project', 'root_link_index_with_hash.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {root_dir: 'spec/html-proofer/fixtures/links/root_folder'})
    expect(proofer.failedChecks).toEqual([])
  })


  it('allows link with no href', async () => {
    const missingLinkHrefFilepath = path.join(FIXTURES_DIR, 'links', 'missing_link_href.html')
    const proofer = await createAndRunProofer(missingLinkHrefFilepath, CheckType.FILE, {allow_missing_href: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('should follow redirects', async () => {
    const linkWithRedirectFilepath = path.join(FIXTURES_DIR, 'links', 'link_with_redirect.html')
    const proofer = await createAndRunProofer(linkWithRedirectFilepath, CheckType.FILE, {enforce_https: false})
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails on redirects if not following', async () => {
    const linkWithRedirectFilepath = path.join(FIXTURES_DIR, 'links', 'link_with_redirect.html')
    const proofer = await createAndRunProofer(linkWithRedirectFilepath, CheckType.FILE,
      {enforce_https: false, typhoeus: {followlocation: false}})
    expect(proofer.failedChecks[0].description).toMatch(new RegExp(/failed/))
  })

  it('does not fail on redirects we\'re not following', async () => {
    // this test should emit a 301--see above--but we're intentionally suppressing it
    const linkWithRedirectFilepath = path.join(FIXTURES_DIR, 'links', 'link_with_redirect.html')
    const proofer = await createAndRunProofer(linkWithRedirectFilepath, CheckType.FILE,
      {only_4xx: true, enforce_https: false, typhoeus: {followlocation: false}})
    expect(proofer.failedChecks).toEqual([])
  })

  it('should understand https', async () => {
    const linkWithHttpsFilepath = path.join(FIXTURES_DIR, 'links', 'link_with_https.html')
    const proofer = await createAndRunProofer(linkWithHttpsFilepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for broken hash links with status code numbers', async () => {
    const brokenLinkWithNumberFilepath = path.join(FIXTURES_DIR, 'links', 'broken_link_with_number.html')
    const proofer = await createAndRunProofer(brokenLinkWithNumberFilepath, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch(
      /internally linking to #25-method-not-allowed; the file exists, but the hash '25-method-not-allowed' does not/)
  })

  it('should understand relative hash', async () => {
    const linkWithHttpsFilepath = path.join(FIXTURES_DIR, 'links', 'relative_hash.html')
    const proofer = await createAndRunProofer(linkWithHttpsFilepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly resolves implicit /index.html in link paths', async () => {
    const linkToFolder = path.join(FIXTURES_DIR, 'links', 'link_to_folder.html')
    const proofer = await createAndRunProofer(linkToFolder, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly checks links to root', async () => {
    const rootLink = path.join(FIXTURES_DIR, 'links', 'root_link/root_link.html')
    const proofer = await createAndRunProofer(rootLink, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly checks relative links', async () => {
    const relativeLinks = path.join(FIXTURES_DIR, 'links', 'relative_links.html')
    const proofer = await createAndRunProofer(relativeLinks, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly checks ssl links', async () => {
    const checkSslLinks = path.join(FIXTURES_DIR, 'links', 'checkSSLLinks.html')
    const proofer = await createAndRunProofer(checkSslLinks, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores links marked as ignore data-proofer-ignore', async () => {
    const ignorableLinks = path.join(FIXTURES_DIR, 'links', 'ignorable_links.html')
    const proofer = await createAndRunProofer(ignorableLinks, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores links via ignore_urls', async () => {
    const opts = {ignore_urls: [/^http:\/\//, /sdadsad/, '../whaadadt.html']}
    const ignorableLinks = path.join(FIXTURES_DIR, 'links', 'ignorable_links_via_options.html')
    const proofer = await createAndRunProofer(ignorableLinks, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('translates links via swap_urls', async () => {
    const translatedLink = path.join(FIXTURES_DIR, 'links', 'link_translated_via_href_swap.html')
    const opts: IOptions = {swap_urls: new Map<string, string>([['/^\/articles\/([\\w-]+)/', '$1.html']])}
    const proofer = await createAndRunProofer(translatedLink, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('translates links via swap_urls for list of links', async () => {
    const opts: IOptions = {swap_urls: new Map<string, string>([['/garbalarba/', 'github']])}
    const proofer = await createAndRunProofer(['http://www.garbalarba.com'], CheckType.LINKS, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('finds a mix of broken and unbroken links', async () => {
    const multipleProblems = path.join(FIXTURES_DIR, 'links', 'multiple_problems.html')
    const proofer = await createAndRunProofer(multipleProblems, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch(
      'internally linking to #anadaasdadsadschor; the file exists, but the hash \'anadaasdadsadschor\' does not')
  })

  it('finds the same broken link multiple times', async () => {
    const multipleProblems = path.join(FIXTURES_DIR, 'links', 'multiple_links.html')
    const proofer = await createAndRunProofer(multipleProblems, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(3)
  })

  it('ignores valid mailto links', async () => {
    const ignorableLinks = path.join(FIXTURES_DIR, 'links', 'mailto_link.html')
    const proofer = await createAndRunProofer(ignorableLinks, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('accepts complex mailto link', async () => {
    const ignorableLinks = path.join(FIXTURES_DIR, 'links', 'mailto_all_properties.html')
    const proofer = await createAndRunProofer(ignorableLinks, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores blank mailto links when configured to allow them', async () => {
    const blankMailToLink = path.join(FIXTURES_DIR, 'links', 'blank_mailto_link.html')
    const proofer = await createAndRunProofer(blankMailToLink, CheckType.FILE, {ignore_empty_mailto: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for blank mailto links', async () => {
    const blankMailToLink = path.join(FIXTURES_DIR, 'links', 'blank_mailto_link.html')
    const proofer = await createAndRunProofer(blankMailToLink, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch('mailto: contains no email address')
  })

  it('fails for invalid mailto links', async () => {
    const invalidMailToLink = path.join(FIXTURES_DIR, 'links', 'invalid_mailto_link.html')
    const proofer = await createAndRunProofer(invalidMailToLink, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch('mailto:octocat contains an invalid email address')
  })

  it('ignores valid tel links', async () => {
    const ignorableLinks = path.join(FIXTURES_DIR, 'links', 'tel_link.html')
    const proofer = await createAndRunProofer(ignorableLinks, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for blank tel links', async () => {
    const blankTelLink = path.join(FIXTURES_DIR, 'links', 'blank_tel_link.html')
    const proofer = await createAndRunProofer(blankTelLink, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch('tel: contains no phone number')
  })

  it('ignores javascript links', async () => {
    const javascriptLink = path.join(FIXTURES_DIR, 'links', 'javascript_link.html')
    const proofer = await createAndRunProofer(javascriptLink, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works for valid links missing the protocol', async () => {
    const missingProtocolLink = path.join(FIXTURES_DIR, 'links', 'link_missing_protocol_valid.html')
    const proofer = await createAndRunProofer(missingProtocolLink, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for invalid links missing the protocol', async () => {
    const missingProtocolLink = path.join(FIXTURES_DIR, 'links', 'link_missing_protocol_invalid.html')
    const proofer = await createAndRunProofer(missingProtocolLink, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch('failed with something very wrong')
  })

  it('works for valid href within link elements', async () => {
    const headLink = path.join(FIXTURES_DIR, 'links', 'head_link_href.html')
    const proofer = await createAndRunProofer(headLink, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('allows empty href on link elements', async () => {
    const headLink = path.join(FIXTURES_DIR, 'links', 'head_link_href_empty.html')
    const proofer = await createAndRunProofer(headLink, CheckType.FILE, {allow_missing_href: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('allows missing href on link elements', async () => {
    const headLink = path.join(FIXTURES_DIR, 'links', 'head_link_href_absent.html')
    const proofer = await createAndRunProofer(headLink, CheckType.FILE, {allow_missing_href: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('allows for internal linking to a directory without trailing slash by default', async () => {
    const internal = path.join(FIXTURES_DIR, 'links', 'link_directory_without_slash.html')
    const proofer = await createAndRunProofer(internal, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for internal linking to a directory without trailing slash', async () => {
    const options = {typhoeus: {followlocation: false}}
    const internal = path.join(FIXTURES_DIR, 'links', 'link_directory_without_slash.html')
    const proofer = await createAndRunProofer(internal, CheckType.FILE, options)
    expect(proofer.failedChecks[0].description).toMatch(/without trailing slash/)
  })

  it('ignores external links when asked', async () => {
    const options = {disable_external: true}
    const external = path.join(FIXTURES_DIR, 'links', 'broken_link_external.html')
    const proofer = await createAndRunProofer(external, CheckType.FILE, options)
    expect(proofer.failedChecks).toEqual([])
  })

  it('validates links with external characters', async () => {
    const options = {disable_external: true}
    const external = path.join(FIXTURES_DIR, 'links', 'external_colon_link.html')
    const proofer = await createAndRunProofer(external, CheckType.FILE, options)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works for array of links', async () => {
    const proofer = await createAndRunProofer(['www.github.com', 'foofoofoo.biz'], CheckType.LINKS)
    expect(proofer.failedChecks[0].description).toMatch(/failed with something very wrong/)
  })

  it('works for broken anchors within pre', async () => {
    const anchorPre = path.join(FIXTURES_DIR, 'links', 'anchors_in_pre.html')
    const proofer = await createAndRunProofer(anchorPre, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works for broken link within pre', async () => {
    const linkPre = path.join(FIXTURES_DIR, 'links', 'links_in_pre.html')
    const proofer = await createAndRunProofer(linkPre, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works for pipes in the URL', async () => {
    const escapePipes = path.join(FIXTURES_DIR, 'links', 'escape_pipes.html')
    const proofer = await createAndRunProofer(escapePipes, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for broken hash with query', async () => {
    const brokenHash = path.join(FIXTURES_DIR, 'links', 'broken_hash_with_query.html')
    const proofer = await createAndRunProofer(brokenHash, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch(/#example; the file exists, but the hash 'example' does not/)
  })

  it('passes when linking to hash on another page', async () => {
    const hashOnAnotherPage = path.join(FIXTURES_DIR, 'links', 'hash_on_another_page.html')
    const proofer = await createAndRunProofer(hashOnAnotherPage, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for mismatched hash casing', async () => {
    const hashOnAnotherPage = path.join(FIXTURES_DIR, 'links', 'hash_mismatched_case.html')
    const proofer = await createAndRunProofer(hashOnAnotherPage, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch('#MainMenu; the file exists, but the hash \'MainMenu\' does not')
  })

  it('works for directory index file', async () => {
    const options = {directory_index_file: 'index.php'}
    const linkPointingToDirectory = path.join(FIXTURES_DIR, 'links', 'link_pointing_to_directory.html')
    const proofer = await createAndRunProofer(linkPointingToDirectory, CheckType.FILE, options)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails if directory index file doesn\'t exist', async () => {
    const options = {directory_index_file: 'README.md'}
    const linkPointingToDirectory = path.join(FIXTURES_DIR, 'links', 'link_pointing_to_directory.html')
    const proofer = await createAndRunProofer(linkPointingToDirectory, CheckType.FILE, options)
    expect(proofer.failedChecks[0].description).toMatch('internally linking to folder-php/, which does not exist')
  })

  it('ensures Typhoeus options are passed', async () => {
    const options = {typhoeus: {ssl_verifypeer: false}}
    const typhoeusOptionsLink = path.join(FIXTURES_DIR, 'links', 'ensure_typhoeus_options.html')
    const proofer = await createAndRunProofer(typhoeusOptionsLink, CheckType.FILE, options)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works if subdirectory }s with .html', async () => {
    const withSubdirectoryHtml = path.join(FIXTURES_DIR, 'links', '_site')
    const proofer = await createAndRunProofer(withSubdirectoryHtml, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works for hash referring to itself', async () => {
    const hashReferringToSelf = path.join(FIXTURES_DIR, 'links', 'hash_referring_to_self.html')
    const proofer = await createAndRunProofer(hashReferringToSelf, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores placeholder with name', async () => {
    const placeholderWithName = path.join(FIXTURES_DIR, 'links', 'placeholder_with_name.html')
    const proofer = await createAndRunProofer(placeholderWithName, CheckType.FILE, {allow_missing_href: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores placeholder with id', async () => {
    const placeholderWithId = path.join(FIXTURES_DIR, 'links', 'placeholder_with_id.html')
    const proofer = await createAndRunProofer(placeholderWithId, CheckType.FILE, {allow_missing_href: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('allows placeholder with empty id', async () => {
    const emptyId = path.join(FIXTURES_DIR, 'links', 'placeholder_with_empty_id.html')
    const proofer = await createAndRunProofer(emptyId, CheckType.FILE, {allow_missing_href: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores non-http(s) protocols', async () => {
    const otherProtocols = path.join(FIXTURES_DIR, 'links', 'other_protocols.html')
    const proofer = await createAndRunProofer(otherProtocols, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes non-standard characters', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'non_standard_characters.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('does not dupe errors', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'nodupe.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
  })

  it('allows unicode domains', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'unicode_domain.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE, {enforce_https: false})
    expect(proofer.failedChecks).toEqual([])
  })

  it('allows punnycode domains', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'punnycode.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE, {enforce_https: false})
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for broken *nix links', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'broken_unix_links.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for external UTF-8 links', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'utf8_link.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for urlencoded href', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'urlencoded-href.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('reports failures for the original link, not the redirection', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'redirected_error.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE, {enforce_https: false})
    expect(proofer.failedChecks[0].description).toMatch('http://stackoverflow.com/asdadsads failed')
  }, 15000) // todo: can we make this test faster?

  it('does not complain for files with attributes containing dashes', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'attribute_with_dash.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for links hash-referencing itself', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'self_ref.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  describe('automatically adding default extensions to files', () => {
    const context: { fixture?: string } = {}

    beforeEach(() => {
      context.fixture = path.join(FIXTURES_DIR, 'links', 'no_html_extension.html')
    })

    it('can be turned off', async () => {
      // Default behaviour does not change
      const proofer = await createAndRunProofer(context.fixture, CheckType.FILE, {assume_extension: ''})
      expect(proofer.failedChecks.length).toBeGreaterThanOrEqual(3)
    })

    it('accepts extensionless file links by default', async () => {
      // With command-line option
      const proofer = await createAndRunProofer(context.fixture, CheckType.FILE)
      expect(proofer.failedChecks).toEqual([])
    })
  })

  it('does check links with parameters multiple times', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'check_just_once.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.externalUrls.size).toEqual(4)
  })

  it('does not explode on bad external links in files', async () => {
    const fixture = path.join(FIXTURES_DIR, 'links', 'bad_external_links.html')
    const proofer = await createAndRunProofer(fixture, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(2)
    expect(proofer.failedChecks[0].description).toMatch(/is an invalid URL/)
  })

  it('does not explode on bad external links in arrays', async () => {
    const proofer = await createAndRunProofer(['www.github.com', 'http://127.0.0.1:____'], CheckType.LINKS)
    expect(proofer.failedChecks[0].description).toMatch(/is an invalid URL/)
  })

  it('passes for non-HTTPS links when asked', async () => {
    const nonHttps = path.join(FIXTURES_DIR, 'links', 'non_https.html')
    const proofer = await createAndRunProofer(nonHttps, CheckType.FILE, {enforce_https: false})
    expect(proofer.failedChecks.length).toEqual(0)
  })

  it('fails for non-HTTPS links by default', async () => {
    const nonHttps = path.join(FIXTURES_DIR, 'links', 'non_https.html')
    const proofer = await createAndRunProofer(nonHttps, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch(/ben.balter.com is not an HTTPS link/)
  })

  it('passes for hash href', async () => {
    const hashHref = path.join(FIXTURES_DIR, 'links', 'hash_href.html')
    const proofer = await createAndRunProofer(hashHref, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(0)
  })

  it('fails for hash href when asked', async () => {
    const hashHref = path.join(FIXTURES_DIR, 'links', 'hash_href.html')
    const proofer = await createAndRunProofer(hashHref, CheckType.FILE, {allow_hash_href: false})
    expect(proofer.failedChecks[0].description).toMatch(/linking to internal hash #, which points to nowhere/)
  })

  it('fails for broken IP address links', async () => {
    const hashHref = path.join(FIXTURES_DIR, 'links', 'ip_href.html')
    const proofer = await createAndRunProofer(hashHref, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch(/failed/)
  }, 60000) // todo: can we make this test faster?

  it('works for internal links to weird encoding IDs', async () => {
    const hashHref = path.join(FIXTURES_DIR, 'links', 'encodingLink.html')
    const proofer = await createAndRunProofer(hashHref, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(0)
  })

  // even though this is valid in HTML5, flag it as an error because it's
  // possibly a mistake
  it('does expect href for anchors in HTML5', async () => {
    const missingHref = path.join(FIXTURES_DIR, 'links', 'blank_href_html5.html')
    const proofer = await createAndRunProofer(missingHref, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
  })

  it('does expect href for anchors in non-HTML5', async () => {
    let missingHref = path.join(FIXTURES_DIR, 'links', 'blank_href_html4.html')
    let proofer = await createAndRunProofer(missingHref, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)

    missingHref = path.join(FIXTURES_DIR, 'links', 'blank_href_htmlunknown.html')
    proofer = await createAndRunProofer(missingHref, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
  })

  it('can skip expecting href for anchors in non-HTML5', async () => {
    let missingHref = path.join(FIXTURES_DIR, 'links', 'blank_href_html4.html')
    let proofer = await createAndRunProofer(missingHref, CheckType.FILE, {allow_missing_href: true})
    expect(proofer.failedChecks.length).toEqual(0)

    missingHref = path.join(FIXTURES_DIR, 'links', 'blank_href_htmlunknown.html')
    proofer = await createAndRunProofer(missingHref, CheckType.FILE, {allow_missing_href: true})
    expect(proofer.failedChecks.length).toEqual(0)
  })

  it('passes for relative links with a base', async () => {
    const relativeLinks = path.join(FIXTURES_DIR, 'links', 'relative_links_with_base.html')
    const proofer = await createAndRunProofer(relativeLinks, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('does not bomb on dns-prefetch', async () => {
    const prefetch = path.join(FIXTURES_DIR, 'links', 'dns-prefetch.html')
    const proofer = await createAndRunProofer(prefetch, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores links when the parent element is ignored', async () => {
    const parentIgnore = path.join(FIXTURES_DIR, 'links', 'ignored_by_parent.html')
    const proofer = await createAndRunProofer(parentIgnore, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('catches links when the parent element is ignored but ancestors_ignorable false', async () => {
    const parentIgnore = path.join(FIXTURES_DIR, 'links', 'ignored_by_parent.html')
    const proofer = await createAndRunProofer(parentIgnore, CheckType.FILE, {ancestors_ignorable: false})
    expect(proofer.failedChecks[0].description).toMatch(/failed with something very wrong/)
  })

  it('does not cgi encode link', async () => {
    const prefetch = path.join(FIXTURES_DIR, 'links', 'do_not_cgi_encode.html')
    const proofer = await createAndRunProofer(prefetch, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works with quotes in the hash href', async () => {
    const hashHref = path.join(FIXTURES_DIR, 'links', 'quote.html')
    const proofer = await createAndRunProofer(hashHref, CheckType.FILE, {allow_hash_href: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('works with base without href', async () => {
    const baseNoHref = path.join(FIXTURES_DIR, 'links', 'base_no_href.html')
    const proofer = await createAndRunProofer(baseNoHref, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('complains if SRI and CORS not provided', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'integrity_and_cors_not_provided.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks[0].description).toMatch(/SRI and CORS not provided/)
  })

  it('complains if SRI not provided', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'cors_not_provided.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks[0].description).toMatch(/CORS not provided/)
  })

  it('complains if CORS not provided', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'integrity_not_provided.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks[0].description).toMatch(/Integrity is missing/)
  })

  it('is happy if SRI and CORS provided', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'integrity_and_cors_provided.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('does not check sri for pagination', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'integrity_and_cors_pagination_rels.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('does not check local scripts', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'local_stylesheet.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('handles timeout', async () => {
    const proofer = await createAndRunProofer(['https://www.sdskafnlkn3rl3204uasfilfkmakmefalkm.com:81'], CheckType.LINKS)
    expect(proofer.failedChecks[0].description).toMatch(/got a time out|the request timed out/)
  })

  it('correctly handles empty href', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'empty_href.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
  })

  it('is not checking SRI and CORS for links with rel canonical or alternate', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'link_with_rel.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('is not checking SRI and CORS for indieweb links with rel "me", "webmention", or "pingback"', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'link_with_me.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('can link to external non-unicode hash', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'hash_to_unicode_ref.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('allows for at-sign attribute', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'at_sign.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {allow_hash_href: false})
    expect(proofer.failedChecks[0].description).toMatch(/linking to internal hash/)
  })

  it('allows for at-sign attribute to be ignored', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'at_sign_ignorable.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('checks source tags', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'source.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failedChecks[0].description).toMatch(/failed/)
  })

  it('works for a direct link through directory', async () => {
    const dir = path.join(FIXTURES_DIR, 'links', 'internals')
    const proofer = await createAndRunProofer(dir, CheckType.DIRECTORY)
    expect(proofer.failedChecks).toEqual([])
  })

  it('knows how to find internal link with additional sources', async () => {
    const emptyDir = path.join(FIXTURES_DIR, 'links', 'same_name_as_dir')
    const validDir = path.join(FIXTURES_DIR, 'links', 'internals')
    const proofer = await createAndRunProofer([validDir, emptyDir], CheckType.DIRECTORIES)
    expect(proofer.failedChecks.length).toEqual(0)
  })

  it('reports linked internal through directory', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'hashes')
    const proofer = await createAndRunProofer(file, CheckType.DIRECTORY)
    expect(proofer.failedChecks[0].description).toMatch(/the file exists, but the hash 'generating-and-submitting' does not/)
  })

  it('works for hash hrefs', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'hash/inner.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {allow_hash_href: true})
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails if hash hrefs are excluded', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'hash/inner.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {allow_hash_href: false})
    expect(proofer.failedChecks.length).toEqual(1)
  })

  // todo: this is different behaviour to Ruby html-proofer
  it('does not crash on badly formatted urls', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'bad_formatting.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('should not try reading PDFs', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'pdfs.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(3)
    expect(proofer.failedChecks[0].description).toMatch(/internally linking to exists.pdf#page=2; the file exists, but the hash 'page=2' does not/)
    expect(last(proofer.failedChecks).description).toMatch(/internally linking to missing.pdf#page=2, which does not exist/)
  })

  // validator.w3c.org consider this case as an error:
  // Error: Bad value #let"s-go for attribute href on element a: Illegal character in fragment: " is not allowed.
  // but browsers handle unescaped double quote in href properly
  it('should not crash on double quoted ids', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'quote_double.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

})
