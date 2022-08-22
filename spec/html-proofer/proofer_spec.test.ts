import * as path from 'path'
import {captureProoferHttp, captureProoferOutput, FIXTURES_DIR, createAndRunProofer} from '../spec-helper'
import {HTMLProofer} from '../../src/html-proofer'
import {CheckType} from "../../src/html-proofer/CheckType"
import {IOptions} from "../../src/interfaces/"

describe('HTMLProofer', () => {
  describe('#failed_checks', () => {
    it('is an array of Failures', async () => {
      const broken_link_internal_filepath = path.join(FIXTURES_DIR, 'links', 'broken_link_internal.html')
      const proofer = await createAndRunProofer(broken_link_internal_filepath, CheckType.FILE, {})
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
      const http = await captureProoferHttp(github_hash, CheckType.FILE, options)
      expect(http['request']['headers']['User-Agent']).toEqual('Mozilla/5.0 (compatible; My New User-Agent)')
    })
  })

  describe('file ignores', () => {
    it('knows how to ignore a file by string', async () => {
      const file1 = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
      const options = {
        ignore_files: [file1],
      }
      const brokenHashInternalFilepath = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
      const proofer = await createAndRunProofer(brokenHashInternalFilepath, CheckType.FILE, options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore a file by regexp', async () => {
      const options = {ignore_files: [/broken_hash/]}
      const brokenHashInternalFilepath = path.join(FIXTURES_DIR, 'links', 'broken_hash_internal.html')
      const proofer = await createAndRunProofer(brokenHashInternalFilepath, CheckType.FILE, options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore multiple files by regexp', async () => {
      const options = {ignore_files: [/.*\/javadoc\/.*/, /.*\/catalog\/.*/]}
      const brokenFolders = path.join(FIXTURES_DIR, 'links', 'folder/multiples')
      const proofer = await createAndRunProofer([brokenFolders], CheckType.DIRECTORIES, options)
      expect(proofer.failed_checks).toEqual([])
    })

    it('knows how to ignore a directory by regexp', async () => {
      const options = {ignore_files: [/\S\.html/]}
      const linksDir = path.join(FIXTURES_DIR, 'links')
      const proofer = await createAndRunProofer([linksDir], CheckType.DIRECTORIES, options)
      expect(proofer.failed_checks).toEqual([])
    })
  })

  describe('external links', () => {
    it('ignores status codes when asked', async () => {
      const options: IOptions = {ignore_status_codes: [404]}
      const proofer = await createAndRunProofer(['http://www.github.com/github/notreallyhere'], CheckType.LINKS, options)
      expect(proofer.failed_checks).toEqual([])
    })
  })

  describe('multiple directories', () => {
    // todo: this one works extremely slow without VCR
    it('works', async () => {
      const dirs = [path.join(FIXTURES_DIR, 'links'), path.join(FIXTURES_DIR, 'images')]
      const opts: IOptions = {use_vcr: true}
      const output = await captureProoferOutput(dirs, CheckType.DIRECTORIES, opts)
      const linksPath = path.join(FIXTURES_DIR, 'links').replaceAll('\\', '/');
      const imagesPath = path.join(FIXTURES_DIR, 'images').replaceAll('\\', '/');

      expect(output).toMatch(linksPath)
      expect(output).toMatch(imagesPath)
    }, 120000) // todo: can we make this test faster?
  })
})
