import {Check} from '../../src/html-proofer/Check'
import {FIXTURES_DIR, make_proofer} from '../spec-helper'
import * as path from 'path'
import {Element} from '../../src/html-proofer/Element'
import {CheckType} from "../../src/html-proofer/CheckType";

class MailToOctocat extends Check {
  run() {
    this.html.css('a').each((i: number, node: any) => {
      const link = this.create_element(node)

      if (link.ignore()) {
        return
      }

      if (this.mailto_octocat(link)) {
        this.add_failure(`Don't email the Octocat directly!`, link.line)
        return
      }
    })
  }

  mailto_octocat(link: Element) {
    return link.url.raw_attribute === 'mailto:octocat@github.com'
  }
}

describe('HTMLProofer::Reporter', () => {
  it('supports a custom reporter', async () => {
    const file = path.join(FIXTURES_DIR, 'links', 'mailto_octocat.html')
    //const cassette_name = make_cassette_name(file, {})

    //VCR.mountCassette(cassette_name/*, record: :new_episodes*/)
    const proofer = make_proofer(file, CheckType.FILE, {checks: [MailToOctocat]})
    await proofer.run()
    //VCR.ejectCassette(cassette_name)
    //const output = capture_stderr { proofer.run }
    //expect(output).to(include("At #{file}:1"))
    const failure = proofer.failed_checks[0]
    expect(failure.description).toEqual(`Don't email the Octocat directly!`)
    expect(failure.line).toEqual(1)
//end
  })
})
