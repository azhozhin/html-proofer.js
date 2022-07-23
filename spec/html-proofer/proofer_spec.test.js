import * as path from 'path'
import {capture_proofer_output, FIXTURES_DIR, make_proofer, run_proofer} from '../spec-helper'
import {HTMLProofer} from '../../lib/html-proofer'

describe('HTMLProofer', () => {
  describe('#failed_checks', () => {
    it('is an array of Failures', async () => {
      const broken_link_internal_filepath = path.join(FIXTURES_DIR, 'links', 'broken_link_internal.html')
      const proofer = await run_proofer(broken_link_internal_filepath, 'file')
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
      expect(proofer.files).
          toEqual([{source: folder, path: `${folder}/index.html`}])
    })
  })

  describe('#options', () => {
    it('strips out undesired Typhoeus options', async () => {
      const folder = path.join(FIXTURES_DIR, 'links', '_site/folder.html')
      const proofer = HTMLProofer.check_file(folder, {verbose: true})
      expect(proofer.options['verbose']).toEqual(true)
      expect(proofer.options['typhoeus']['verbose']).toEqual(null)
    })

    it('takes options for Parallel', async () => {
      const folder = path.join(FIXTURES_DIR, 'links', '_site/folder.html')
      const options = {parallel: {in_processes: 3}}
      const proofer = HTMLProofer.check_file(folder, options)
      expect(proofer.options['parallel']['in_processes']).toEqual(3)
      expect(proofer.options['typhoeus']['in_processes']).toBeNull()
    })

    it('only has one UA with file', async () => {
      const github_hash = path.join(FIXTURES_DIR, 'links', 'github_hash.html')
      let options = {
        typhoeus: {
          verbose: true,
          headers: {'User-Agent': 'Mozilla/5.0 (compatible; My New User-Agent)'},
        },
      }
      const http = capture_proofer_http(github_hash, 'file', options)
      expect(http['request']['headers']['User-Agent']).toEqual(['Mozilla/5.0 (compatible; My New User-Agent)'])
    })
  })

  describe('file ignores', () => {
    it('knows how to ignore a file by string', async () => {
      const options = {
        ignore_files: [
          path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')],
      }
      const broken_hash_internal_filepath = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
      const proofer = await run_proofer(broken_hash_internal_filepath, 'file', options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore a file by regexp', async () => {
      const options = {ignore_files: [/broken_hash/]}
      const broken_hash_internal_filepath = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
      const proofer = await run_proofer(broken_hash_internal_filepath, 'file', options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore multiple files by regexp', async () => {
      const options = {ignore_files: [/.*\/javadoc\/.*/, /.*\/catalog\/.*/]}
      const broken_folders = path.join(FIXTURES_DIR, 'links', 'folder/multiples')
      const proofer = await run_proofer([broken_folders], 'directories', options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore a directory by regexp', async () => {
      const options = {ignore_files: [/\S\.html/]}
      const links_dir = path.join(FIXTURES_DIR, 'links')
      const proofer = await run_proofer([links_dir], 'directories', options)
      expect(proofer.failed_checks).toEqual([])
    })
  })

  describe('external links', () => {
    it('ignores status codes when asked', async () => {
      const options = {ignore_status_codes: [404]}
      const proofer = await run_proofer(['http://www.github.com/github/notreallyhere'], 'links', options)
      expect(proofer.failed_checks).toEqual([])
    })
  })

  describe('multiple directories', () => {
    it('works', async () => {
      const dirs = [path.join(FIXTURES_DIR, 'links'), path.join(FIXTURES_DIR, 'images')]
      const output = await capture_proofer_output(dirs, 'directories')
      expect(output).toMatch(path.join(FIXTURES_DIR, 'links'))
      expect(output).toMatch(path.join(FIXTURES_DIR, 'images'))
    })
  })
})
