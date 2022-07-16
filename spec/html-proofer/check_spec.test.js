import {Check} from '../../lib/html-proofer/check'
import {FIXTURES_DIR, make_proofer} from '../spec-helper'
import * as path from 'path'

class MailToOctocat extends Check {
  run() {
    this.html.css('a').each((i, node) => {
      this.link = this.create_element(node)

      if (this.link.ignore()) {
        return
      }

      if (this.mailto_octocat()) {
        this.add_failure('Don\'t email the Octocat directly!', this.link.line)
        return
      }
    })
  }

  mailto_octocat() {
    return this.link.url.raw_attribute === 'mailto:octocat@github.com'
  }
}

describe('HTMLProofer::Reporter', () => {
  it('supports a custom reporter', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'mailto_octocat.html')
    //const cassette_name = make_cassette_name(file, {})

//VCR.use_cassette(cassette_name, record: :new_episodes) do
    const proofer = make_proofer(file, 'file', {checks: [MailToOctocat]})
    await proofer.run()
    //const output = capture_stderr { proofer.run }
    //expect(output).to(include("At #{file}:1"))
    const failure = proofer.failed_checks.last
    expect(failure.description).toEqual('Don\'t email the Octocat directly!')
    expect(failure.line).toEqual(1)
//end
  })
})
