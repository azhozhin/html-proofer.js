import {run_proofer} from '../spec-helper.js'

describe('Maliciousness test', () => {
  it('does not accept non-string input for single file', async () => {
    await expect(async () => {
      await run_proofer(23, 'file')
    }).rejects.toThrow('ArgumentError')

  })

  it('does not accept non-string input for directory', async () => {
    await expect(async () => {
      await run_proofer(['wow/wow'], 'directory')
    }).rejects.toThrow('ArgumentError: wow/wow does not exist')
  })

  it('does not accept string input for directories', async () => {
    await expect(async () => {
      await run_proofer('wow/wow', 'directories')
    }).rejects.toThrow('ArgumentError')
  })

  it('does not accept string input for links', async () => {
    await expect(async () => {
      await run_proofer('woo', 'links')
    }).rejects.toThrow('ArgumentError')
  })
})
