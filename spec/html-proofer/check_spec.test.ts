import {Check} from '../../src/html-proofer/Check'
import {FIXTURES_DIR, createProofer} from '../spec-helper'
import * as path from 'path'
import {Element} from '../../src/html-proofer/Element'
import {CheckType} from "../../src/html-proofer/CheckType";
import {ICheckResult} from "../../src/interfaces";

class MailToOctocat extends Check {
  public run(): ICheckResult {
    for (const node of this.html.css('a')) {
      const link = this.create_element(node)

      if (link.ignore()) {
        continue
      }

      if (this.mailto_octocat(link)) {
        this.add_failure(`Don't email the Octocat directly!`, link.line)
        continue
      }
    }

    return {
      externalUrls: this.externalUrls,
      internalUrls: this.internalUrls,
      failures: this.failures
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
    const failure = proofer.failed_checks[0]
    expect(failure.description).toEqual(`Don't email the Octocat directly!`)
    expect(failure.line).toEqual(1)
  })
})
