import {Runner} from '../../../src/html-proofer/Runner'
import {Url} from '../../../src/html-proofer/attribute/Url'

describe('HTMLProofer::Attribute::Url', () => {
  const context: { runner?: Runner } = {}

  beforeEach(() => {
    context.runner = new Runner('')
  })

  describe('#ignores_pattern_check', () => {
    it('works for regex patterns', () => {
      const runner = context.runner!
      runner.options.ignore_urls = [/\/assets\/.*(js|css|png|svg)/]
      const url = new Url(runner, '/assets/main.js')
      expect(url.ignore()).toBeTruthy()
    })

    it('works for string patterns', () => {
      const runner = context.runner!;
      runner.options.ignore_urls = ['/assets/main.js']
      const url = new Url(runner, '/assets/main.js')
      expect(url.ignore()).toBeTruthy()
    })
  })
})
