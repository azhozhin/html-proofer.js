import {run_proofer} from '../spec-helper'
import {CheckType} from "../../src/html-proofer/CheckType";

describe('Maliciousness test', () => {
  it('does not accept non-string input for single file', async () => {
    await expect(async () => {
      await run_proofer(23, CheckType.FILE)
    }).rejects.toThrow('ArgumentError')

  })

  it('does not accept non-string input for directory', async () => {
    await expect(async () => {
      await run_proofer(['wow/wow'], CheckType.DIRECTORY)
    }).rejects.toThrow('ArgumentError: wow/wow does not exist')
  })

  it('does not accept string input for directories', async () => {
    await expect(async () => {
      await run_proofer('wow/wow', CheckType.DIRECTORIES)
    }).rejects.toThrow('ArgumentError')
  })

  it('does not accept string input for links', async () => {
    await expect(async () => {
      await run_proofer('woo', CheckType.LINKS)
    }).rejects.toThrow('ArgumentError')
  })
})
