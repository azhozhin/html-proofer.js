import {FIXTURES_DIR, make_bin} from '../spec-helper.js'
import {Configuration} from '../../lib/html-proofer/configuration.js'
import * as fs from 'fs'
import * as path from 'path'

describe('Command test', () => {
  it('works with as-links', async () => {
    const output = await make_bin('--as-links www.github.com,foofoofoo.biz')
    expect(output).toMatch('1 failure')
  })

  it('works with checks', async () => {
    const external = path.join(FIXTURES_DIR, 'links', 'file.foo') // this has a broken link
    const output = await make_bin(`--extensions .foo --checks 'Images,Scripts' ${external}`)
    expect(output).toMatch('successfully')
    expect(output).not.toMatch(/Running.+?Links/)
  })

  it('works with check-external-hash', async () => {
    const broken_hash_on_the_web = path.join(FIXTURES_DIR, 'links', 'broken_hash_on_the_web.html')
    const output = await make_bin(`--check-external-hash ${broken_hash_on_the_web}`)
    expect(output).toMatch('1 failure')
  })

  it('works with directory-index-file', async () => {
    const link_pointing_to_directory = path.join(FIXTURES_DIR, 'links', 'link_pointing_to_directory.html')
    const output = await make_bin(`--directory-index-file index.php ${link_pointing_to_directory}`)
    expect(output).toMatch('successfully')
  })

  it('works with disable-external', async () => {
    const external = path.join(FIXTURES_DIR, 'links', 'broken_link_external.html')
    const output = await make_bin(`--disable-external ${external}`)
    expect(output).toMatch('successfully')
  })

  it('works with extensions', async () => {
    const external = path.join(FIXTURES_DIR, 'links', 'file.foo')
    const output = await make_bin(`--extensions .foo ${external}`)
    expect(output).toMatch('1 failure')
    expect(output).toMatch('Links')
  })

  it('works with ignore-files', async () => {
    const external = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
    const output = await make_bin(`--ignore-files ${external} ${external}`)
    expect(output).toMatch('successfully')
  })

  it('works with ignore-urls', async () => {
    const ignorable_links = path.join(FIXTURES_DIR, 'links', 'ignorable_links_via_options.html')
    const output = await make_bin(`--ignore-urls /^http:\/\//,/sdadsad/,../whaadadt.html ${ignorable_links}`)
    expect(output).toMatch('successfully')
  })

  it('works with swap-urls', async () => {
    const translated_link = path.join(FIXTURES_DIR, 'links', 'link_translated_via_href_swap.html')
    const output = await make_bin(`--swap-urls "/^/articles/([\\w-]+)/:$1.html" ${translated_link}`)
    expect(output).toMatch('successfully')
  })

  it('works with swap-urls and colon', async () => {
    const translated_link = path.join(FIXTURES_DIR, 'links', 'link_translated_via_href_swap2.html')
    const output = await make_bin(`--swap-urls "http\\://www.example.com:" ${translated_link}`)
    expect(output).toMatch('successfully')
  })

  it('works with only-4xx', async () => {
    const broken_hash_on_the_web = path.join(FIXTURES_DIR, 'links', 'broken_hash_on_the_web.html')
    const output = await make_bin(`--only-4xx ${broken_hash_on_the_web}`)
    expect(output).toMatch('successfully')
  })

  it('works with check-favicon', async () => {
    const broken = path.join(FIXTURES_DIR, 'favicon', 'internal_favicon_broken.html')
    const output = await make_bin(`--checks Favicon ${broken}`)
    expect(output).toMatch('1 failure')
  })

  it('works with empty-alt-ignore', async () => {
    const broken = path.join(FIXTURES_DIR, 'images', 'empty_image_alt_text.html')
    const output = await make_bin(`--ignore-empty-alt ${broken}`)
    expect(output).toMatch('successfully')
  })

  it('works with allow-hash-href', async () => {
    const broken = path.join(FIXTURES_DIR, 'links', 'hash_href.html')
    const output = await make_bin(`--allow-hash-href ${broken}`)
    expect(output).toMatch('successfully')
  })

  it('works with swap-attributes', async () => {
    const custom_data_src_check = path.join(FIXTURES_DIR, 'images', 'data_src_attribute.html')
    const output = await make_bin(`${custom_data_src_check}  --swap-attributes '{\"img\": [[\"src\", \"data-src\"]] }'`)
    expect(output).toMatch('successfully')
  })

  it('navigates above itself in a subdirectory', async () => {
    const real_link = path.join(FIXTURES_DIR, 'links', 'root_folder/documentation-from-my-project/')
    const output = await make_bin(`--root-dir ${path.join(FIXTURES_DIR, 'links', 'root_folder/')} ${real_link}`)
    expect(output).toMatch('successfully')
  })

  it('has every option for proofer defaults', () => {
    match_command_help(Configuration.PROOFER_DEFAULTS)
  })

  describe('nested options', () => {
    it('supports typhoeus', async () => {
      const link_with_redirect_filepath = path.join(FIXTURES_DIR, 'links', 'link_with_redirect.html')
      const output = await make_bin(`${link_with_redirect_filepath} --typhoeus '{ \"followlocation\": false }'`)
      expect(output).toMatch(/failed/)
    })

    it('has only one UA', async () => {
      const http = await make_bin(
          `--typhoeus='{"verbose":true,"headers":{"User-Agent":"Mozilla/5.0 (Macintosh; My New User-Agent)"}}' --as-links https://linkedin.com`)
      expect(http.search(/User-Agent: Typhoeus/)).toEqual(-1)
      expect(http.scan(`User-Agent: Mozilla/5.0 \(Macintosh; My New User-Agent\)`).count).toEqual(2)
    })

    it('supports hydra', async () => {
      const http = await make_bin(`--hydra '{"max_concurrency": 5}' http://www.github.com --as-links`)
      expect(http.search(/max_concurrency is invalid/)).toEqual(-1)
    })
  })
})

function match_command_help(config) {
  const config_keys = Object.keys(config)
  const bin_file = fs.readFileSync('bin/htmlproofer.js').toString()
  const help_output = make_bin('--help')
  const readme = fs.readFileSync('README.md').toString()

  for (const key of config_keys) {
// match options
    expect(bin_file).toMatch(key)
    let matched = false
    for (const line of readme.split('\n')) {
      if (!line.match(/\| `${key}`/)) {
        continue
      }

      matched = true
      let description = line.split('|')[2].trim()
      description = description.replaceAll('A hash', 'A comma-separated list')
      description = description.replaceAll('An array', 'A comma-separated list')
      description = description.replaceAll(/\[(.+?)\]\(.+?\)/, '$1')
      description = description.replace(/\.$/, '')

      // match README description for option
      expect(help_output).toContain(description)
    }

    if (!matched){
      try {
        expect(matched).toBeTruthy()
      } catch (e) {
        throw new Error(`Could not find '${key}' explained in README!`)
      }
    }
  }
}

