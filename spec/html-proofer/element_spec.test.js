import {Runner} from '../../lib/html-proofer/runner'
import {create_nokogiri} from '../../lib/html-proofer/utils'
import * as path from 'path'
import {FIXTURES_DIR, run_proofer} from '../spec-helper'
import {Element} from '../../lib/html-proofer/element'

describe('HTMLProofer::Element', () => {

  let context = {runner: null}

  beforeEach(() => {
    context.runner = new Runner('')
    //# @check = HTMLProofer::Check.new('', '', Nokogiri::HTML5(''), nil, nil, HTMLProofer::Configuration::PROOFER_DEFAULTS)
  })

  describe('#initialize', () => {

    it('accepts the xmlns attribute', () => {
      const doc = create_nokogiri('<a docxmlns:cc="http://creativecommons.org/ns#">Creative Commons</a>')
      const element = new Element(context.runner, doc, doc.css('a')[0])
      expect(element.node['xmlns:cc']).toEqual('http://creativecommons.org/ns#')
    })

    it('assigns the text node', () => {
      const doc = create_nokogiri('<p>One')
      const element = new Element(context.runner, doc, doc.css('p')[0])
      expect(element.node.text).toEqual('One')
      expect(element.node.content).toEqual('One')
    })

    it('accepts the content attribute', () => {
      const doc = create_nokogiri('<meta name="twitter:card" content="summary">')
      const element = new Element(context.runner, doc, doc.css('meta')[0])
      expect(element.node['content']).toEqual('summary')
    })

  })

  describe('#link_attribute', () => {
    it('works for src attributes', () => {
      const doc = create_nokogiri('<img src=image.png />')
      const element = new Element(context.runner, doc, doc.css('img')[0])
      expect(element.url.toString()).toEqual('image.png')

    })
  })

  describe('#ignore', () => {
    it('works for twitter cards', () => {
      const doc = create_nokogiri(
          '<meta name="twitter:url" data-proofer-ignore content="http://example.com/soon-to-be-published-url">')
      const element = new Element(context.runner, doc, doc.css('meta')[0])
      expect(element.ignore()).toEqual(true)
    })

  })

  describe('ivar setting', () => {
    it('does not explode if given a bad attribute', async () => {
      const broken_attribute = path.join(FIXTURES_DIR, 'html', 'invalid_attribute.html')
      const proofer = await run_proofer(broken_attribute, 'file')
      expect(proofer.failed_checks.length).toEqual(0)
    })
  })

  describe('return content properly', () => {
    it('0', () => {
      const doc = create_nokogiri('<meta content="abc">')
      const element = new Element(context.runner, doc, doc.css('meta')[0])
      expect(element.content).toEqual('abc')
    })

    it('1', () => {
      const doc = create_nokogiri('<meta>')
      const element = new Element(context.runner, doc, doc.css('meta')[0])
      expect(element.content).toBeNull()
    })

    it('1.1', () => {
      const doc = create_nokogiri('<meta />')
      const element = new Element(context.runner, doc, doc.css('meta')[0])
      expect(element.content).toBeNull()
    })

    it('1.2', () => {
      const doc = create_nokogiri('<meta data-tag="a"/>')
      const element = new Element(context.runner, doc, doc.css('meta')[0])
      expect(element.content).toBeNull()
    })

    it('2', () => {
      const doc = create_nokogiri(' <script />')
      const element = new Element(context.runner, doc, doc.css('script')[0])
      expect(element.content).toBeNull()
    })

    it('2.1', () => {
      const doc = create_nokogiri(' <script data-tag="b"/>')
      const element = new Element(context.runner, doc, doc.css('script')[0])
      expect(element.content).toBeNull()
    })

    it('3', () => {
      const doc = create_nokogiri(' <script></script>')
      const element = new Element(context.runner, doc, doc.css('script')[0])
      expect(element.content).toEqual('')
    })

    it('3.1', () => {
      const doc = create_nokogiri(' <script data-tag="b"></script>')
      const element = new Element(context.runner, doc, doc.css('script')[0])
      expect(element.content).toEqual('')
    })
  })

})
