import {capture_stderr, FIXTURES_DIR, make_proofer} from '../spec-helper.js'
import * as fs from 'fs'
import * as path from 'path'

describe('HTMLProofer::Runner', () => {
  describe('#before_request', () => {
    it('sends authorization header to github.com', async () => {
      const opts = {}
      const url = 'https://github.com'
      const proofer = make_proofer([url], 'links', opts)
      let request = null
      const auth = 'Bearer <TOKEN>'
      proofer.add_before_request((r) => {
        if (r.base_url() === url) {
          r.options['headers']['Authorization'] = auth
        }
        request = r
      })

      //cassette_name = make_cassette_name(File.join(FIXTURES_DIR, "links", "check_just_once.html"), opts)
      //VCR.use_cassette(cassette_name, record: :new_episodes) do
      await capture_stderr(async () => {
        await proofer.run()
      })
      //proofer
      //end

      expect(request).toEqual(expect.objectContaining({
        options: expect.any(Object),
      }))
      expect(request.options).toEqual(expect.objectContaining({
        headers: expect.any(Object),
      }))
      expect(request.options['headers']).toEqual(expect.objectContaining({
        'Authorization': auth,
      }))
    })

    it('plays nice with cache', async () => {
      const cache_file_name = '.runner.json'
      const storage_dir = path.join(FIXTURES_DIR, 'cache', 'version_2')
      const cache_location = path.join(storage_dir, cache_file_name)

      if (fs.existsSync(cache_location)) {
        fs.unlinkSync(cache_location)
      }

      //const now_time = Time.local(2022, 2, 17, 12, 0, 0)
      //Timecop.freeze(now_time){

      const opts = {
        cache: {timeframe: {external: '1d'}, cache_file: cache_file_name, storage_dir: storage_dir},
      }
      const dir = path.join(FIXTURES_DIR, 'links', '_site')
      const proofer = make_proofer(dir, 'directory', opts)
      let request = null
      const auth = 'Bearer <TOKEN>'
      proofer.add_before_request((r) => {
        r.options['headers']['Authorization'] = auth
        request = r
      })

//cassette_name = make_cassette_name(dir, opts)
//VCR.use_cassette(cassette_name, record: :new_episodes) do
      await capture_stderr(async () => {
        await proofer.run()
      })
//  proofer
//end

      expect(request).toEqual(expect.objectContaining({
        options: expect.any(Object),
      }))
      expect(request.options).toEqual(expect.objectContaining({
        headers: expect.any(Object),
      }))
      expect(request.options['headers']).toEqual(expect.objectContaining({
        'Authorization': auth,
      }))
      //end
      //}
    })
  })
})