import {Check} from '../Check'
import {Element} from "../Element";
import {last} from "../Utils";
import {ICheckResult} from "../../interfaces";

export class Favicon extends Check {
  public run(): ICheckResult {
    let found = false
    let favicon: Element | null = null
    this.html.css('link').each((i: number, node: any) => {
      favicon = this.create_element(node)

      if (favicon.ignore()) {
        return
      }

      found = last(favicon.node['rel'].split(' ')) === 'icon'
      if (found) {
        return false
      }
    })

    if (this.immediate_redirect()) {
      // do nothing
    } else {
      if (found) {
        if (favicon!.url.remote()) {
          this.add_to_external_urls(favicon!.url, favicon!.line)
        } else if (!favicon!.url.exists()) {
          this.add_failure(`internal favicon ${favicon!.url.raw_attribute} does not exist`, favicon!.line, null, favicon!.content)
        }
      } else {
        this.add_failure('no favicon provided')
      }
    }

    return {
      external_urls: this.external_urls,
      internal_urls: this.internal_urls,
      failures: this.failures
    }
  }

  // allow any instant-redirect meta tag
  immediate_redirect() {
    const content = this.html.css('meta[http-equiv="refresh"]')
    if (!content || content.length === 0) {
      return false
    }

    return content[0].attribs['content'].startsWith('0;')
  }
}
