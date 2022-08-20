import {adapt_nokogiri_node, create_nokogiri} from '../../src/html-proofer/Utils'
import * as path from 'path'
import {FIXTURES_DIR} from '../spec-helper'

describe('Utils', () => {
  describe('::create_nokogiri', () => {
    it('passes for a string', () => {
      const noko = create_nokogiri('<html lang="jp">')
      const nokoNode = noko.css('html')[0]
      const node = adapt_nokogiri_node(noko, nokoNode)
      expect(node.attributes['lang']).toEqual('jp')
    })

    it('passes for a file', () => {
      const noko = create_nokogiri(path.join(FIXTURES_DIR, 'utils', 'lang-jp.html'))
      const nokoNode = noko.css('html')[0];
      const node = adapt_nokogiri_node(noko, nokoNode)
      expect(node.attributes['lang']).toEqual('jp')
    })

    it('ignores directories', () => {
      const noko = create_nokogiri(path.join(FIXTURES_DIR, 'utils'))
      const filePath = path.join('spec', 'html-proofer', 'fixtures', 'utils');
      expect(noko.text).toEqual(filePath)
    })
  })
})
