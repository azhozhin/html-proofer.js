import {createDocument} from '../../src/html-proofer/Utils'
import * as path from 'path'
import {FIXTURES_DIR} from '../spec-helper'

describe('Utils', () => {
  describe('::create_nokogiri', () => {
    it('passes for a string', () => {
      const doc = createDocument('<html lang="jp">')
      const node = doc.css('html')[0]
      expect(node.attributes['lang']).toEqual('jp')
    })

    it('passes for a file', () => {
      const doc = createDocument(path.join(FIXTURES_DIR, 'utils', 'lang-jp.html'))
      const node = doc.css('html')[0];
      expect(node.attributes['lang']).toEqual('jp')
    })

    it('ignores directories', () => {
      const doc = createDocument(path.join(FIXTURES_DIR, 'utils'))
      const filePath = path.join('spec', 'html-proofer', 'fixtures', 'utils');
      expect(doc.text).toEqual(filePath)
    })
  })
})
