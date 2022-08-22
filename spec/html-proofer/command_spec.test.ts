// noinspection HttpUrlsUsage

import {FIXTURES_DIR, runProoferCli} from '../spec-helper'
import {Configuration} from '../../src/html-proofer/Configuration'
import * as fs from 'fs'
import * as path from 'path'
import {IOptions} from '../../src/interfaces'

describe('Command test', () => {
  it('works with as-links', async () => {
    const {output, exitCode} = await runProoferCli('--as-links www.github.com,foofoofoo.biz')
    expect(output).toMatch('1 failure')
    expect(exitCode).not.toBe(0)
  })

  it('works with checks', async () => {
    const external = path.join(FIXTURES_DIR, 'links', 'file.foo') // this has a broken link
    const {output, exitCode} = await runProoferCli(`--extensions .foo --checks "Images,Scripts" ${external}`)
    expect(output).toMatch('successfully')
    expect(output).not.toMatch(/Running.+?Links/)
    expect(exitCode).toBe(0)
  })

  it('works with check-external-hash', async () => {
    const brokenHashOnTheWeb = path.join(FIXTURES_DIR, 'links', 'broken_hash_on_the_web.html')
    const {output, exitCode} = await runProoferCli(`${brokenHashOnTheWeb} --check-external-hash`)
    expect(output).toMatch('1 failure')
    expect(exitCode).not.toBe(0)
  })

  it('works with directory-index-file', async () => {
    const linkPointingToDirectory = path.join(FIXTURES_DIR, 'links', 'link_pointing_to_directory.html')
    const {output, exitCode} = await runProoferCli(`--directory-index-file index.php ${linkPointingToDirectory}`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with disable-external', async () => {
    const external = path.join(FIXTURES_DIR, 'links', 'broken_link_external.html')
    const {output, exitCode} = await runProoferCli(`--disable-external ${external}`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with extensions', async () => {
    const external = path.join(FIXTURES_DIR, 'links', 'file.foo')
    const {output, exitCode} = await runProoferCli(`--extensions .foo ${external}`)
    expect(output).toMatch('1 failure')
    expect(output).toMatch('Links')
    expect(exitCode).not.toBe(0)
  })

  it('works with ignore-files', async () => {
    const external = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
    const {output, exitCode} = await runProoferCli(`--ignore-files ${external} ${external}`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with ignore-urls', async () => {
    const ignorableLinks = path.join(FIXTURES_DIR, 'links', 'ignorable_links_via_options.html')
    const {
      output,
      exitCode
    } = await runProoferCli(`--ignore-urls "/^http:\/\//,/sdadsad/,../whaadadt.html" ${ignorableLinks}`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with swap-urls', async () => {
    const translatedLink = path.join(FIXTURES_DIR, 'links', 'link_translated_via_href_swap.html')
    const {output, exitCode} = await runProoferCli(`--swap-urls "/^/articles/([\\w-]+)/:\\$1.html" ${translatedLink}`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with swap-urls and colon', async () => {
    const translatedLink = path.join(FIXTURES_DIR, 'links', 'link_translated_via_href_swap2.html')
    const {output, exitCode} = await runProoferCli(`--swap-urls "http\\://www.example.com:" ${translatedLink}`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with only-4xx', async () => {
    const brokenHashOnTheWeb = path.join(FIXTURES_DIR, 'links', 'broken_hash_on_the_web.html')
    const {output, exitCode} = await runProoferCli(`${brokenHashOnTheWeb} --only-4xx`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with check-favicon', async () => {
    const broken = path.join(FIXTURES_DIR, 'favicon', 'internal_favicon_broken.html')
    const {output, exitCode} = await runProoferCli(`--checks "Favicon" ${broken}`)
    expect(output).toMatch('1 failure')
    expect(exitCode).not.toBe(0)
  })

  it('works with empty-alt-ignore', async () => {
    const broken = path.join(FIXTURES_DIR, 'images', 'empty_image_alt_text.html')
    const {output, exitCode} = await runProoferCli(`${broken} --ignore-empty-alt`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with allow-hash-href', async () => {
    const broken = path.join(FIXTURES_DIR, 'links', 'hash_href.html')
    const {output, exitCode} = await runProoferCli(`${broken} --allow-hash-href`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('works with swap-attributes', async () => {
    const customDataSrcCheck = path.join(FIXTURES_DIR, 'images', 'data_src_attribute.html')
    const {
      output,
      exitCode
    } = await runProoferCli(`--swap-attributes "{'img': [['src', 'data-src']] }" ${customDataSrcCheck}`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('navigates above itself in a subdirectory', async () => {
    const realLink = path.join(FIXTURES_DIR, 'links', 'root_folder/documentation-from-my-project/')
    const rootDir = path.join(FIXTURES_DIR, 'links', 'root_folder/')
    const {output, exitCode} = await runProoferCli(`--root-dir ${rootDir} ${realLink}`)
    expect(output).toMatch('successfully')
    expect(exitCode).toBe(0)
  })

  it('has every option for proofer defaults', async () => {
    await match_command_help(Configuration.PROOFER_DEFAULTS)
  })

  describe('nested options', () => {
    it('supports typhoeus', async () => {
      const linkWithRedirectFilepath = path.join(FIXTURES_DIR, 'links', 'link_with_redirect.html')
      const {
        output,
        exitCode
      } = await runProoferCli(`--typhoeus "{'followlocation': false}" ${linkWithRedirectFilepath}`)
      expect(output).toMatch(/failed/)
      expect(exitCode).not.toBe(0)
    })

    it('has only one UA', async () => {
      const {output, exitCode} = await runProoferCli(
        `--typhoeus="{'verbose':true,'headers':{'User-Agent':'Mozilla/5.0 (Macintosh; My New User-Agent)'}}" --as-links https://linkedin.com`)
      expect(output.search(/"User-Agent": "Typhoeus"/)).toEqual(-1)
      expect(output.split('\n').filter(e => e.match(/"User-Agent": "Mozilla\/5.0 \(Macintosh; My New User-Agent\)"/)).length).toEqual(2)
      expect(exitCode).toBe(0)
    })

    it('supports hydra', async () => {
      const {
        output,
        exitCode
      } = await runProoferCli(`--hydra "{\"max_concurrency\": 5}" --as-links http://www.github.com`)
      expect(output.search(/max_concurrency is invalid/)).toEqual(-1)
      expect(exitCode).toBe(0)
    })
  })
})

async function match_command_help(config: IOptions) {
  const configKeys = Object.keys(config)
  const binFile = fs.readFileSync('bin/htmlproofer.ts').toString()
  const {output, exitCode} = await runProoferCli('--help')
  expect(exitCode).toBe(0)
  const readme = fs.readFileSync('README.md').toString()

  for (const key of configKeys) {
    const keyRe = new RegExp(key)
// match options
    expect(binFile).toMatch(keyRe)
    let matched = false
    for (const line of readme.split('\n')) {
      const re = new RegExp('^\\| `' + key + '`')
      if (!re.test(line)) {
        continue
      }

      matched = true
      let description = line.split('|')[2].trim()
      description = description.replaceAll('A hash', 'A comma-separated list')
      description = description.replaceAll('An array', 'A comma-separated list')
      description = description.replaceAll(/\[(.+?)\]\(.+?\)/g, '$1')
      description = description.replace(/\.$/, '')

      // match README description for option
      expect(output).toContain(description)
    }

    if (!matched) {
      try {
        expect(matched).toBeTruthy()
      } catch (e) {
        throw new Error(`Could not find '${key}' explained in README!`)
      }
    }
  }
}

