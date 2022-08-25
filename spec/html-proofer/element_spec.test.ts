import {Runner} from '../../src/html-proofer/Runner'

import * as path from 'path'
import {FIXTURES_DIR, createAndRunProofer} from '../spec-helper'
import {Element} from '../../src/html-proofer/Element'
import {IRunner} from '../../src/interfaces/'
import {CheckType} from '../../src/html-proofer/CheckType'
import {createDocument} from '../../src/html-proofer/Utils'

describe('HTMLProofer::Element', () => {

  const context: { runner: IRunner | null } = {runner: null}

  beforeEach(() => {
    context.runner = new Runner([''], {})
    // # @check = HTMLProofer::Check.new('', '', Nokogiri::HTML5(''), nil, nil, HTMLProofer::Configuration::PROOFER_DEFAULTS)
  })

  describe('#initialize', () => {

    it('accepts the xmlns attribute', () => {
      const doc = createDocument('<a xmlns:cc="http://creativecommons.org/ns#">Creative Commons</a>')
      const node = doc.css('a')[0]
      const element = new Element(context.runner!, doc, node)
      expect(element.node.attributes['xmlns:cc']).toEqual('http://creativecommons.org/ns#')
    })

    it('assigns the text node', () => {
      const doc = createDocument('<p>One')
      const node = doc.css('p')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.node.text).toEqual('One')
      expect(element.node.content).toEqual('One')
    })

    it('accepts the content attribute', () => {
      const doc = createDocument('<meta name="twitter:card" content="summary">')
      const node = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.node.attributes.content).toEqual('summary')
    })

  })

  describe('#link_attribute', () => {
    it('works for src attributes', () => {
      const doc = createDocument('<img src=image.png />')
      const node = doc.css('img')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.url.toString()).toEqual('image.png')

    })
  })

  describe('#ignore', () => {
    it('works for twitter cards', () => {
      const doc = createDocument('<meta name="twitter:url" data-proofer-ignore content="http://example.com/soon-to-be-published-url">')
      const node = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.isIgnore()).toEqual(true)
    })

  })

  // todo: this should be in proofer_spec.test.ts
  describe('ivar setting', () => {
    it('does not explode if given a bad attribute', async () => {
      const brokenAttribute = path.join(FIXTURES_DIR, 'html', 'invalid_attribute.html')
      const proofer = await createAndRunProofer(brokenAttribute, CheckType.FILE)
      expect(proofer.failedChecks).toEqual([])
    })
  })

  describe('return content properly', () => {
    it('0', () => {
      const doc = createDocument('<meta content="abc">')
      const node = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.node.attributes.content).toEqual('abc')
    })

    it('1', () => {
      const doc = createDocument('<meta>')
      const node = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.content).toBeNull()
    })

    it('1.1', () => {
      const doc = createDocument('<meta />')
      const node = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.content).toBeNull()
    })

    it('1.2', () => {
      const doc = createDocument('<meta data-tag="a"/>')
      const node = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.content).toBeNull()
    })

    it('2', () => {
      const doc = createDocument(' <script />')
      const node = doc.css('script')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.content).toBeNull()
    })

    it('2.1', () => {
      const doc = createDocument(' <script data-tag="b"/>')
      const node = doc.css('script')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.content).toBeNull()
    })

    it('3', () => {
      const doc = createDocument(' <script></script>')
      const node = doc.css('script')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.content).toEqual('')
    })

    it('3.1', () => {
      const doc = createDocument(' <script data-tag="b"></script>')
      const node = doc.css('script')[0];
      const element = new Element(context.runner!, doc, node)
      expect(element.content).toEqual('')
    })
  })

})
