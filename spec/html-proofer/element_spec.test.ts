import {Runner} from '../../src/html-proofer/Runner'

import * as path from 'path'
import {FIXTURES_DIR, run_proofer} from '../spec-helper'
import {Element} from '../../src/html-proofer/Element'
import {IRunner} from '../../src/interfaces/'
import {CheckType} from '../../src/html-proofer/CheckType'
import {create_nokogiri} from '../../src/html-proofer/Utils'

describe('HTMLProofer::Element', () => {

  let context: { runner: IRunner | null } = {runner: null}

  beforeEach(() => {
    context.runner = new Runner('')
    //# @check = HTMLProofer::Check.new('', '', Nokogiri::HTML5(''), nil, nil, HTMLProofer::Configuration::PROOFER_DEFAULTS)
  })

  describe('#initialize', () => {

    it('accepts the xmlns attribute', () => {
      const noko = create_nokogiri('<a xmlns:cc="http://creativecommons.org/ns#">Creative Commons</a>')
      const nokoNode = noko.css('a')[0];
      const element = new Element(context.runner!, noko, nokoNode)
      expect(element.node['xmlns:cc']).toEqual('http://creativecommons.org/ns#')
    })

    it('assigns the text node', () => {
      const noko = create_nokogiri('<p>One')
      const nokoNode = noko.css('p')[0];
      const element = new Element(context.runner!, noko, nokoNode)
      expect(element.node.text).toEqual('One')
      expect(element.node.content).toEqual('One')
    })

    it('accepts the content attribute', () => {
      const noko = create_nokogiri('<meta name="twitter:card" content="summary">')
      const nokoNode = noko.css('meta')[0];
      const element = new Element(context.runner!, noko, nokoNode)
      expect(element.node['content']).toEqual('summary')
    })

  })

  describe('#link_attribute', () => {
    it('works for src attributes', () => {
      const noko = create_nokogiri('<img src=image.png />')
      const nokoNode = noko.css('img')[0];
      const element = new Element(context.runner!, noko, nokoNode)
      expect(element.url.toString()).toEqual('image.png')

    })
  })

  describe('#ignore', () => {
    it('works for twitter cards', () => {
      const noko = create_nokogiri(
          '<meta name="twitter:url" data-proofer-ignore content="http://example.com/soon-to-be-published-url">')
      const nokoNode = noko.css('meta')[0];
      const element = new Element(context.runner!, noko, nokoNode)
      expect(element.ignore()).toEqual(true)
    })

  })

  // todo: this should be in proofer_spec.test.ts
  describe('ivar setting', () => {
    it('does not explode if given a bad attribute', async () => {
      const broken_attribute = path.join(FIXTURES_DIR, 'html', 'invalid_attribute.html')
      const proofer = await run_proofer(broken_attribute, CheckType.FILE)
      expect(proofer.failed_checks).toEqual([])
    })
  })

  describe('return content properly', () => {
    it('0', () => {
      const doc = create_nokogiri('<meta content="abc">')
      const nokoNode = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, nokoNode)
      expect(element.content).toEqual('abc')
    })

    it('1', () => {
      const doc = create_nokogiri('<meta>')
      const nokoNode = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, nokoNode)
      expect(element.content).toBeNull()
    })

    it('1.1', () => {
      const doc = create_nokogiri('<meta />')
      const nokoNode = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, nokoNode)
      expect(element.content).toBeNull()
    })

    it('1.2', () => {
      const doc = create_nokogiri('<meta data-tag="a"/>')
      const nokoNode = doc.css('meta')[0];
      const element = new Element(context.runner!, doc, nokoNode)
      expect(element.content).toBeNull()
    })

    it('2', () => {
      const doc = create_nokogiri(' <script />')
      const nokoNode = doc.css('script')[0];
      const element = new Element(context.runner!, doc, nokoNode)
      expect(element.content).toBeNull()
    })

    it('2.1', () => {
      const doc = create_nokogiri(' <script data-tag="b"/>')
      const nokoNode = doc.css('script')[0];
      const element = new Element(context.runner!, doc, nokoNode)
      expect(element.content).toBeNull()
    })

    it('3', () => {
      const doc = create_nokogiri(' <script></script>')
      const nokoNode = doc.css('script')[0];
      const element = new Element(context.runner!, doc, nokoNode)
      expect(element.content).toEqual('')
    })

    it('3.1', () => {
      const doc = create_nokogiri(' <script data-tag="b"></script>')
      const nokoNode = doc.css('script')[0];
      const element = new Element(context.runner!, doc, nokoNode)
      expect(element.content).toEqual('')
    })
  })

})
