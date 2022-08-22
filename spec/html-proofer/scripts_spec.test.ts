import {FIXTURES_DIR, createAndRunProofer} from '../spec-helper'
import * as path from 'path'
import {CheckType} from "../../src/html-proofer/CheckType"
import {IOptions} from "../../src/interfaces/"

describe('Scripts test', () => {
  it('fails for broken external src', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'script_broken_external.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failed_checks.length).toEqual(1)
    expect(proofer.failed_checks[0].description).toMatch(/failed with something very wrong/)
  })

  it('works for valid internal src', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'script_valid_internal.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failed_checks).toEqual([])
  })

  it('fails for missing internal src', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'script_missing_internal.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failed_checks.length).toEqual(1)
    expect(proofer.failed_checks[0].description).toMatch(/internal script reference doesnotexist.js does not exist/)
  })

  it('works for present content', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'script_content.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failed_checks).toEqual([])
  })

  it('fails for absent content', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'script_content_absent.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE)
    expect(proofer.failed_checks[0].description).toMatch(/script is empty and has no src attribute/)
  })

  it('works for broken script within pre', async () => {
    const scriptPre = path.join(FIXTURES_DIR, 'scripts', 'script_in_pre.html')
    const proofer = await createAndRunProofer(scriptPre, CheckType.FILE)
    expect(proofer.failed_checks).toEqual([])
  })

  it('ignores links via ignore_urls', async () => {
    const ignorableLinks = path.join(FIXTURES_DIR, 'scripts', 'ignorable_links_via_options.html')
    const proofer = await createAndRunProofer(ignorableLinks, CheckType.FILE, {ignore_urls: [/\/assets\/.*(js|css|png|svg)/]})
    expect(proofer.failed_checks).toEqual([])
  })

  it('translates src via swap_urls', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'script_abs_url.html')
    const opts: IOptions = {swap_urls: new Map<string, string>([['/^http:\/\/example.com/', '']])}
    const proofer = await createAndRunProofer(file, CheckType.FILE, opts)
    expect(proofer.failed_checks).toEqual([])
  })

  it('is unhappy if SRI and CORS not provided', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'integrity_and_cors_not_provided.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failed_checks[0].description).toMatch(/SRI and CORS not provided/)
  })

  it('is unhappy if SRI not provided', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'cors_not_provided.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failed_checks[0].description).toMatch(/CORS not provided/)
  })

  it('is unhappy if CORS not provided', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'integrity_not_provided.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failed_checks[0].description).toMatch(/Integrity is missing/)
  })

  it('is happy if SRI and CORS provided', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'integrity_and_cors_provided.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failed_checks).toEqual([])
  })

  it('does not check SRI/CORS for local scripts', async () => {
    const file = path.join(FIXTURES_DIR, 'scripts', 'local_script.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failed_checks).toEqual([])
  })
})
