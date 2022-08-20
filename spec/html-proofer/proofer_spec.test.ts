import * as path from 'path'
import {capture_proofer_http, capture_proofer_output, FIXTURES_DIR, run_proofer} from '../spec-helper'
import {HTMLProofer} from '../../src/html-proofer'
import {CheckType} from "../../src/html-proofer/CheckType"
import {IOptions} from "../../src/interfaces/"

describe('HTMLProofer', () => {
  describe('#failed_checks', () => {
    it('is an array of Failures', async () => {
      const broken_link_internal_filepath = path.join(FIXTURES_DIR, 'links', 'broken_link_internal.html')
      const proofer = await run_proofer(broken_link_internal_filepath, CheckType.FILE, {})
      expect(proofer.failed_checks.length).toEqual(2)

      const check = proofer.failed_checks[0]
      expect(check.constructor.name).toEqual('Failure')
      expect(check.path).toEqual(broken_link_internal_filepath)
      expect(check.description).toEqual('internally linking to ./notreal.html, which does not exist')
      expect(check.line).toEqual(3)
    })
  })

  describe('#files', () => {
    it('works for directory that ends with .html', async () => {
      const folder = path.join(FIXTURES_DIR, 'links', '_site/folder.html').replace(/\\/g, '/')
      const proofer = HTMLProofer.check_directory(folder)
      expect(proofer.files).toEqual([{source: folder, path: `${folder}/index.html`}])
    })
  })

  describe('#options', () => {
    it('strips out undesired Typhoeus options', async () => {
      const folder = path.join(FIXTURES_DIR, 'links', '_site/folder.html')
      const proofer = HTMLProofer.check_file(folder, {verbose: true})
      expect(proofer.options['verbose']).toEqual(true)
      expect(proofer.options['typhoeus']['verbose']).toBeUndefined()
    })

    it('takes options for Parallel', async () => {
      const folder = path.join(FIXTURES_DIR, 'links', '_site/folder.html')
      const options = {parallel: {in_processes: 3}}
      const proofer = HTMLProofer.check_file(folder, options)
      expect(proofer.options['parallel']['in_processes']).toEqual(3)
      expect(proofer.options['typhoeus']['in_processes']).toBeUndefined()
    })

    it('only has one UA with file', async () => {
      const github_hash = path.join(FIXTURES_DIR, 'links', 'github_hash.html')
      let options = {
        typhoeus: {
          verbose: true,
          headers: {'User-Agent': 'Mozilla/5.0 (compatible; My New User-Agent)'},
        },
      }
      const http = await capture_proofer_http(github_hash, CheckType.FILE, options)
      expect(http['request']['headers']['User-Agent']).toEqual('Mozilla/5.0 (compatible; My New User-Agent)')
    })
  })

  describe('file ignores', () => {
    it('knows how to ignore a file by string', async () => {
      const file1 = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
      const options = {
        ignore_files: [file1],
      }
      const broken_hash_internal_filepath = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
      const proofer = await run_proofer(broken_hash_internal_filepath, CheckType.FILE, options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore a file by regexp', async () => {
      const options = {ignore_files: [/broken_hash/]}
      const broken_hash_internal_filepath = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
      const proofer = await run_proofer(broken_hash_internal_filepath, CheckType.FILE, options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore multiple files by regexp', async () => {
      const options = {ignore_files: [/.*\/javadoc\/.*/, /.*\/catalog\/.*/]}
      const broken_folders = path.join(FIXTURES_DIR, 'links', 'folder/multiples')
      const proofer = await run_proofer([broken_folders], CheckType.DIRECTORIES, options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore a directory by regexp', async () => {
      const options = {ignore_files: [/\S\.html/]}
      const links_dir = path.join(FIXTURES_DIR, 'links')
      const proofer = await run_proofer([links_dir], CheckType.DIRECTORIES, options)
      expect(proofer.failed_checks).toEqual([])
    })
  })

  describe('external links', () => {
    it('ignores status codes when asked', async () => {
      const options: IOptions = {ignore_status_codes: [404]}
      const proofer = await run_proofer(['http://www.github.com/github/notreallyhere'], CheckType.LINKS, options)
      expect(proofer.failed_checks).toEqual([])
    })
  })

  describe('multiple directories', () => {
    // todo: this one works extremely slow without VCR
    // it('works', async () => {
    //   const dirs = [path.join(FIXTURES_DIR, 'links'), path.join(FIXTURES_DIR, 'images')]
    //   const opts: IOptions = {use_vcr: true}
    //   const output = await capture_proofer_output(dirs, CheckType.DIRECTORIES, opts)
    //   const linksPath = path.join(FIXTURES_DIR, 'links').replaceAll('\\', '/');
    //   const imagesPath = path.join(FIXTURES_DIR, 'images').replaceAll('\\', '/');
    //
    //   expect(output).toMatch(linksPath)
    //   expect(output).toMatch(imagesPath)
    // }, 120000) // todo: can we make this test faster?
  })
})
