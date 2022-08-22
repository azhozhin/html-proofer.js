import {Check} from '../../src/html-proofer/Check'
import {FIXTURES_DIR, createProofer} from '../spec-helper'
import * as path from 'path'
import {Element} from '../../src/html-proofer/Element'
import {CheckType} from '../../src/html-proofer/CheckType'

class MailToOctocat extends Check {
  internalRun(): void {
    for (const node of this.html.css('a')) {
      const link = this.createElement(node)

      if (link.isIgnore()) {
        continue
      }

      if (this.mailto_octocat(link)) {
        this.addFailure(`Don't email the Octocat directly!`, link.line)
        continue
      }
    }
  }

  mailto_octocat(link: Element) {
    return link.url.rawAttribute === 'mailto:octocat@github.com'
  }
}

describe('HTMLProofer::Reporter', () => {
  it('supports a custom reporter', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'mailto_octocat.html')
    // const cassette_name = make_cassette_name(file, {})

    // VCR.mountCassette(cassette_name/*, record: :new_episodes*/)
    const proofer = createProofer(file, CheckType.FILE, {checks: [MailToOctocat]})
    await proofer.run()
    // VCR.ejectCassette(cassette_name)
    // const output = capture_stderr { proofer.run }
    // expect(output).to(include("At #{file}:1"))
    const failure = proofer.failedChecks[0]
    expect(failure.description).toEqual(`Don't email the Octocat directly!`)
    expect(failure.line).toEqual(1)
  })
})
