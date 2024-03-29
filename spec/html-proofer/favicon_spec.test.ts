import * as path from 'path'
import {FIXTURES_DIR, createAndRunProofer} from '../spec-helper'
import {Favicon} from '../../src/html-proofer/checks/Favicon'
import {CheckType} from "../../src/html-proofer/CheckType"
import {IOptions} from "../../src/interfaces/"

describe('Favicons test', () => {
  it('ignores for absent favicon by default', async () => {
    const absent = path.join(FIXTURES_DIR, 'favicon', 'favicon_absent.html')
    const proofer = await createAndRunProofer(absent, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for absent favicon', async () => {
    const absent = path.join(FIXTURES_DIR, 'favicon', 'favicon_absent.html')
    const proofer = await createAndRunProofer(absent, CheckType.FILE, {checks: [Favicon]})
    expect(proofer.failedChecks[0].description).toMatch(/no favicon provided/)
  })

  it('fails for absent favicon but present apple touch icon', async () => {
    const absent = path.join(FIXTURES_DIR, 'favicon', 'favicon_absent_apple.html')
    const proofer = await createAndRunProofer(absent, CheckType.FILE, {checks: [Favicon]})
    expect(proofer.failedChecks[0].description).toMatch(/(no favicon provided)/)
  })

  it('fails for broken internal favicon', async () => {
    const broken = path.join(FIXTURES_DIR, 'favicon', 'internal_favicon_broken.html')
    const proofer = await createAndRunProofer(broken, CheckType.FILE, {checks: [Favicon]})
    expect(proofer.failedChecks[0].description).toMatch(/internal favicon asdadaskdalsdk.png/)
  })

  it('fails for broken external favicon', async () => {
    const broken = path.join(FIXTURES_DIR, 'favicon', 'external_favicon_broken.html')
    const proofer = await createAndRunProofer(broken, CheckType.FILE, {checks: [Favicon]})
    expect(proofer.failedChecks[0].description).toMatch('External link https://www.github.com/asdadaskdalsdk.png')
  })

  it('fails for ignored with ignore_urls', async () => {
    const ignored = path.join(FIXTURES_DIR, 'favicon', 'internal_favicon_broken.html')
    const proofer = await createAndRunProofer(ignored, CheckType.FILE, {checks: [Favicon], ignore_urls: [/asdadaskdalsdk/]})
    expect(proofer.failedChecks[0].description).toMatch(/no favicon provided/)
  })

  it('translates links via swap_urls', async () => {
    const opts: IOptions = {
      checks: [Favicon],
      swap_urls: new Map<string, string>([['/^asdadaskdalsdk.+/', '../resources/gpl.png']]),
    }
    const translated_link = path.join(FIXTURES_DIR, 'favicon', 'internal_favicon_broken.html')
    const proofer = await createAndRunProofer(translated_link, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for present favicon', async () => {
    const present = path.join(FIXTURES_DIR, 'favicon', 'favicon_present.html')
    const proofer = await createAndRunProofer(present, CheckType.FILE, {checks: [Favicon]})
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for present favicon with shortcut notation', async () => {
    const present = path.join(FIXTURES_DIR, 'favicon', 'favicon_present_shortcut.html')
    const proofer = await createAndRunProofer(present, CheckType.FILE, {checks: [Favicon]})
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for broken favicon with data-proofer-ignore', async () => {
    const broken_but_ignored = path.join(FIXTURES_DIR, 'favicon', 'favicon_broken_but_ignored.html')
    const proofer = await createAndRunProofer(broken_but_ignored, CheckType.FILE, {checks: [Favicon]})
    expect(proofer.failedChecks[0].description).toMatch(/no favicon provided/)
  })

  it('specifically ignores jekyll redirect_from template', async () => {
    const broken_but_ignored = path.join(FIXTURES_DIR, 'favicon', 'jekyll_redirect_from.html')
    const proofer = await createAndRunProofer(broken_but_ignored, CheckType.FILE, {checks: [Favicon]})
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores SRI/CORS requirements for favicons', async () => {
    const file = path.join(FIXTURES_DIR, 'favicon', 'cors_not_needed.html')
    const proofer = await createAndRunProofer(file, CheckType.FILE, {check_sri: true})
    expect(proofer.failedChecks).toEqual([])
  })
})
