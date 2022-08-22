import {OpenGraph} from '../../src/html-proofer/check/OpenGraph'
import {FIXTURES_DIR, createAndRunProofer} from '../spec-helper'
import * as path from 'path'
import {CheckType} from "../../src/html-proofer/CheckType"
import {IOptions} from "../../src/interfaces/"

describe('Open Graph test', () => {
  it('passes for existing external url', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'url-valid.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for missing url content attribute', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'url-missing.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks.length).toBe(1)
    expect(proofer.failedChecks[0].description).toMatch(/open graph has no content attribute/)
  })

  it('fails for empty url', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'url-empty.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks.length).toBe(1)
    expect(proofer.failedChecks[0].description).toMatch(/open graph content attribute is empty/)
  })

  it('fails for missing external url', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'url-broken.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks.length).toBe(1)
    expect(proofer.failedChecks[0].description).toMatch(/failed with something very wrong/)
  })

  it('passes for existing external image', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'image-valid.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for missing image content attribute', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'image-missing.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks.length).toBe(1)
    expect(proofer.failedChecks[0].description).toMatch(/open graph has no content attribute/)
  })

  it('fails for empty image', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'image-empty.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks.length).toBe(1)
    expect(proofer.failedChecks[0].description).toMatch(/open graph content attribute is empty/)
  })

  it('fails for missing external image', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'image-broken.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks.length).toBe(1)
    expect(proofer.failedChecks[0].description).toMatch(/failed/)
  })

  it('fails for missing internal images', async () => {
    const image_internal_invalid = path.join(FIXTURES_DIR, 'opengraph', 'image-internal-broken.html')
    const proofer = await createAndRunProofer(image_internal_invalid, CheckType.FILE, {checks: [OpenGraph]})
    expect(proofer.failedChecks.length).toBe(1)
    expect(proofer.failedChecks[0].description).toMatch(/doesnotexist.png does not exist/)
  })

  it('passes for missing external url when not asked to check', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'url-broken.html')
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for missing external image when not asked to check', async () => {
    const url_valid = path.join(FIXTURES_DIR, 'opengraph', 'image-broken.html')
    const opts: IOptions = {check_opengraph: false}
    const proofer = await createAndRunProofer(url_valid, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })
})
