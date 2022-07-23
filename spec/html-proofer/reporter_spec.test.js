import {capture_stderr, FIXTURES_DIR, make_cassette_name, make_proofer} from '../spec-helper.js'
import * as path from 'path'
import {Reporter} from '../../lib/html-proofer/reporter.js'
import * as VCR from 'axios-vcr'

class CustomReporter extends Reporter {
  report() {
    this.logger.log('error', `Womp womp, found ${this.failures.length} issues`)
  }
}

describe('HTMLProofer::Reporter', () => {
  it('supports a custom reporter', async () => {
    const file = path.join(FIXTURES_DIR, 'sorting', 'kitchen_sinkish.html')
    //const cassette_name = make_cassette_name(file, {})

    //VCR.mountCassette(cassette_name/*, record: :new_episodes*/)
    const proofer = make_proofer(file, 'file', {})
    proofer.reporter = new CustomReporter(proofer.logger)
    const output = await capture_stderr(async () => {
      await proofer.run()
    })
    //VCR.ejectCassette(cassette_name)
    expect(output).toMatch('Womp womp, found')
//end
  })
})