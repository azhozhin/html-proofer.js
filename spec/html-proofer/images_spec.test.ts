import * as path from 'path'
import {FIXTURES_DIR, createAndRunProofer} from '../spec-helper'
import {CheckType} from '../../src/html-proofer/CheckType'
import {IOptions} from '../../src/interfaces/'

describe('Images test', () => {
  it('passes for existing external images', async () => {
    const external_image_filepath = path.join(FIXTURES_DIR, 'images', 'existing_image_external.html')
    const proofer = await createAndRunProofer(external_image_filepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for image missing alt attribute', async () => {
    const missing_alt_filepath = path.join(FIXTURES_DIR, 'images', 'missing_image_alt.html')
    const proofer = await createAndRunProofer(missing_alt_filepath, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/gpl.png does not have an alt attribute/)
  })

  it('does not fail for image missing alt attribute when asked to ignore', async () => {
    const missing_alt_filepath = path.join(FIXTURES_DIR, 'images', 'missing_image_alt.html')
    const opts: IOptions = {ignore_missing_alt: true}
    const proofer = await createAndRunProofer(missing_alt_filepath, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('does not fail for image with an empty alt attribute', async () => {
    const missing_alt_filepath = path.join(FIXTURES_DIR, 'images', 'missing_image_alt_text.html')
    const proofer = await createAndRunProofer(missing_alt_filepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for image with an empty alt attribute when asked', async () => {
    const missing_alt_filepath = path.join(FIXTURES_DIR, 'images', 'missing_image_alt_text.html')
    const opts: IOptions = {ignore_empty_alt: false}
    const proofer = await createAndRunProofer(missing_alt_filepath, CheckType.FILE, opts)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/gpl.png has an alt attribute, but no content/)
  })

  it('does not fail for image with nothing but spaces in alt attribute', async () => {
    const empty_alt_filepath = path.join(FIXTURES_DIR, 'images', 'empty_image_alt_text.html')
    const proofer = await createAndRunProofer(empty_alt_filepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fail for image with nothing but spaces in alt attribute when asked', async () => {
    const empty_alt_filepath = path.join(FIXTURES_DIR, 'images', 'empty_image_alt_text.html')
    const opts: IOptions = {ignore_empty_alt: false}
    const proofer = await createAndRunProofer(empty_alt_filepath, CheckType.FILE, opts)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/gpl.png has an alt attribute, but no content/)
  })

  it('passes when ignoring image with nothing but spaces in alt attribute', async () => {
    const empty_alt_filepath = path.join(FIXTURES_DIR, 'images', 'empty_image_alt_text.html')
    const opts: IOptions = {ignore_urls: [/.+/]};
    const proofer = await createAndRunProofer(empty_alt_filepath, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for missing internal images even when ignore_urls is set', async () => {
    const internal_image_filepath = path.join(FIXTURES_DIR, 'images', 'missing_image_internal.html')
    const opts: IOptions = {ignore_urls: [/.*/]};
    const proofer = await createAndRunProofer(internal_image_filepath, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for images with spaces all over', async () => {
    const spaced_filepath = path.join(FIXTURES_DIR, 'images', 'spaced_image.html')
    const proofer = await createAndRunProofer(spaced_filepath, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for missing external images', async () => {
    const external_image_filepath = path.join(FIXTURES_DIR, 'images', 'missing_image_external.html')
    const proofer = await createAndRunProofer(external_image_filepath, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/failed with something very wrong/)
  })

  it('fails for missing internal images', async () => {
    const internal_image_filepath = path.join(FIXTURES_DIR, 'images', 'missing_image_internal.html')
    const proofer = await createAndRunProofer(internal_image_filepath, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/doesnotexist.png does not exist/)
  })

  it('fails for image with no src', async () => {
    const image_src_filepath = path.join(FIXTURES_DIR, 'images', 'missing_image_src.html')
    const proofer = await createAndRunProofer(image_src_filepath, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/image has no src or srcset attribute/)
  })

  it('fails for image with default macOS filename', async () => {
    const terrible_image_name = path.join(FIXTURES_DIR, 'images', 'terrible_image_name.html')
    const proofer = await createAndRunProofer(terrible_image_name, CheckType.FILE)
    expect(proofer.failedChecks.length).toBeGreaterThanOrEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/image has a terrible filename/)
  })

  it('ignores images marked as ignore data-proofer-ignore', async () => {
    const ignorable_images = path.join(FIXTURES_DIR, 'images', 'ignorableImages.html')
    const proofer = await createAndRunProofer(ignorable_images, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores images via ignore_urls', async () => {
    const ignorable_image = path.join(FIXTURES_DIR, 'images', 'terrible_image_name.html')
    const opts: IOptions = {ignore_urls: [/.\/Screen.+/]};
    const proofer = await createAndRunProofer(ignorable_image, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('translates images via swap_urls', async () => {
    const translated_link = path.join(FIXTURES_DIR, 'images', 'terrible_image_name.html')
    const opts: IOptions = {swap_urls: new Map<string, string>([['/.\/Screen.+/', 'gpl.png']])}
    const proofer = await createAndRunProofer(translated_link, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly checks relative images', async () => {
    let relative_images = path.join(FIXTURES_DIR, 'images', 'root_relative_images.html')
    let proofer = await createAndRunProofer(relative_images, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])

    relative_images = path.join(FIXTURES_DIR, 'resources', 'books', 'nestedRelativeImages.html')
    proofer = await createAndRunProofer(relative_images, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly ignores data URI images', async () => {
    const data_uri_image = path.join(FIXTURES_DIR, 'images', 'working_data_uri_image.html')
    const proofer = await createAndRunProofer(data_uri_image, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works for valid images missing the protocol', async () => {
    const missing_protocol_link = path.join(FIXTURES_DIR, 'images', 'image_missing_protocol_valid.html')
    const proofer = await createAndRunProofer(missing_protocol_link, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for invalid images missing the protocol', async () => {
    const missing_protocol_link = path.join(FIXTURES_DIR, 'images', 'image_missing_protocol_invalid.html')
    const proofer = await createAndRunProofer(missing_protocol_link, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/failed/)
  })

  it('properly checks relative links', async () => {
    const relative_links = path.join(FIXTURES_DIR, 'images', 'relative_to_self.html')
    const proofer = await createAndRunProofer(relative_links, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly ignores missing alt tags when asked', async () => {
    const ignoreable_links = path.join(FIXTURES_DIR, 'images', 'ignorable_alt_via_options.html')
    const opts:IOptions = {ignore_urls: [/wikimedia/, 'gpl.png']};
    const proofer = await createAndRunProofer(ignoreable_links, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly ignores missing alt tags when asked', async () => {
    const ignoreable_links = path.join(FIXTURES_DIR, 'images', 'ignore_alt_but_not_link.html')
    const opts:IOptions = {ignore_urls: [/.*/]}
    const proofer = await createAndRunProofer(ignoreable_links, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly ignores empty alt attribute when ignore_missing_alt set to true', async () => {
    const missing_alt_filepath = path.join(FIXTURES_DIR, 'images', 'empty_image_alt_text.html')
    const opts:IOptions = {ignore_missing_alt: true}
    const proofer = await createAndRunProofer(missing_alt_filepath, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('properly reports empty alt attribute when ignore_missing_alt set to false', async () => {
    const missing_alt_filepath = path.join(FIXTURES_DIR, 'images', 'empty_image_alt_text.html')
    const opts:IOptions = {ignore_missing_alt: false}
    const proofer = await createAndRunProofer(missing_alt_filepath, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('works for images with a srcset', async () => {
    const src_set_check = path.join(FIXTURES_DIR, 'images', 'src_set_check.html')
    const proofer = await createAndRunProofer(src_set_check, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(2)
  })

  it('skips missing alt tag for images marked as aria-hidden', async () => {
    const src_set_check = path.join(FIXTURES_DIR, 'images', 'aria_hidden.html')
    const proofer = await createAndRunProofer(src_set_check, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for images with a srcset but missing alt', async () => {
    const src_set_missing_alt = path.join(FIXTURES_DIR, 'images', 'src_set_missing_alt.html')
    const proofer = await createAndRunProofer(src_set_missing_alt, CheckType.FILE)
    expect(proofer.failedChecks.length).toBeGreaterThanOrEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/image gpl.png does not have an alt attribute/)
  })

  it('fails for images with an alt but missing src or srcset', async () => {
    const src_set_missing_alt = path.join(FIXTURES_DIR, 'images', 'src_set_missing_image.html')
    const proofer = await createAndRunProofer(src_set_missing_alt, CheckType.FILE)
    expect(proofer.failedChecks.length).toBeGreaterThanOrEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/image has no src or srcset attribute/)
  })

  it('properly ignores missing alt tags when asked for srcset', async () => {
    const ignoreable_links = path.join(FIXTURES_DIR, 'images', 'src_set_ignorable.html')
    const opts:IOptions = {ignore_urls: [/wikimedia/, 'gpl.png']};
    const proofer = await createAndRunProofer(ignoreable_links, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('translates src via swap_urls', async () => {
    const translate_src = path.join(FIXTURES_DIR, 'images', 'replace_abs_url_src.html')
    const opts: IOptions = {swap_urls: new Map<string, string>([['/^http:\/\/baseurl.com/', '']])}
    const proofer = await createAndRunProofer(translate_src, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('passes for HTTP images when asked', async () => {
    const http = path.join(FIXTURES_DIR, 'images', 'src_http.html')
    const opts: IOptions = {enforce_https: false}
    const proofer = await createAndRunProofer(http, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('fails for HTTP images when not asked', async () => {
    const http = path.join(FIXTURES_DIR, 'images', 'src_http.html')
    const proofer = await createAndRunProofer(http, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toMatch(/uses the http scheme/)
  })

  it('properly checks relative images with base', async () => {
    const relative_images = path.join(FIXTURES_DIR, 'images', 'relative_with_base.html')
    const proofer = await createAndRunProofer(relative_images, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('ignores semicolon outside attribute name', async () => {
    const relative_images = path.join(FIXTURES_DIR, 'images', 'semicolon.html')
    const proofer = await createAndRunProofer(relative_images, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('supports multiple srcsets when passes', async () => {
    const relative_images = path.join(FIXTURES_DIR, 'images', 'multiple_srcset_success.html')
    const proofer = await createAndRunProofer(relative_images, CheckType.FILE)
    expect(proofer.failedChecks).toEqual([])
  })

  it('supports multiple srcsets when fails', async () => {
    const relative_images = path.join(FIXTURES_DIR, 'images', 'multiple_srcset_failure.html')
    const proofer = await createAndRunProofer(relative_images, CheckType.FILE)
    expect(proofer.failedChecks.length).toEqual(1)
    expect(proofer.failedChecks[0].description).toEqual('internal image /uploads/150-marie-lloyd.jpg 1.5x does not exist')
  })

  it('works for images with a swapped data attribute src', async () => {
    const custom_data_src_check = path.join(FIXTURES_DIR, 'images', 'data_src_attribute.html')
    const opts:IOptions = {swap_attributes: {'img': [['src', 'data-src']]}}
    const proofer = await createAndRunProofer(custom_data_src_check, CheckType.FILE, opts)
    expect(proofer.failedChecks).toEqual([])
  })

  it('breaks for images with a swapped attribute that does not exist', async () => {
    const custom_data_src_check = path.join(FIXTURES_DIR, 'images', 'data_src_attribute.html')
    const opts:IOptions = {swap_attributes: {'img': [['src', 'foobar']]}}
    const proofer = await createAndRunProofer(custom_data_src_check, CheckType.FILE, opts)
    expect(proofer.failedChecks.length).toEqual(1)
  })
})
