import {Configuration} from '../../src/html-proofer/Configuration'

describe('JSON config parser', () => {

  it('Throws an error when the option name is empty', () => {
    expect(() => {
      Configuration.parse_json_option('', '{}')
    }).toThrowError(new Error('ArgumentError: Must provide an option name in string format.'))
  })

  it('Throws an error when the option name is whitespace', () => {
    expect(() => {
      Configuration.parse_json_option('    ', '{}')
    }).toThrowError(new Error('ArgumentError: Must provide an option name in string format.'))
  })

  it('returns an empty options object when config is nil', () => {
    const result = Configuration.parse_json_option('testName', null)
    expect(result).toEqual({})
  })

  it('returns an empty options object when config is empty', () => {
    const result = Configuration.parse_json_option('testName', '')
    expect(result).toEqual({})
  })

  it('returns an empty options object when config is whitespace', () => {
    const result = Configuration.parse_json_option('testName', '    ')
    expect(result).toEqual({})
  })

  it('Returns an object representing the json when valid json', () => {
    const result = Configuration.parse_json_option('testName',
        `{ 'myValue': 'hello world!', 'numberValue': 123}`)
    expect(result['myValue']).toEqual('hello world!')
    expect(result['numberValue']).toEqual(123)
  })

  it('Throws an error when the json config is not valid json', () => {
    expect(() => {
      Configuration.parse_json_option('testName', 'abc')
    }).toThrowError('ArgumentError')
  })
})
