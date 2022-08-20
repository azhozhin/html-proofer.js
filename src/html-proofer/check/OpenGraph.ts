import {Check} from '../Check'
import {Element} from "../Element";
import {ICheckResult} from "../../interfaces";

export class OpenGraph extends Check {

  public run():ICheckResult {
    this.html.css('meta[property="og:url"], meta[property="og:image"]').each((i:number, node:any) => {
      const openGraph = this.create_element(node)

      if (openGraph.ignore()) {
        return
      }

      //does the openGraph exist?
      if (this.missing_content(openGraph)) {
        this.add_failure('open graph has no content attribute', openGraph.line, null, openGraph.content)
      } else if (this.empty_content(openGraph)) {
        this.add_failure('open graph content attribute is empty', openGraph.line, null, openGraph.content)
      } else if (!openGraph.url.valid()) {
        this.add_failure(`${openGraph.src} is an invalid URL`, openGraph.line)
      } else if (openGraph.url.remote()) {
        this.add_to_external_urls(openGraph.url, openGraph.line)
      } else {
        if (!openGraph.url.exists()) {
          this.add_failure(`internal open graph ${openGraph.url.raw_attribute} does not exist`,
              openGraph.line, null, openGraph.content)
        }
      }
    })

    return {
      external_urls: this.external_urls,
      internal_urls: this.internal_urls,
      failures: this.failures
    }
  }

  missing_content(element:Element) {
    return element.node['content'] == null
  }

  empty_content(element:Element) {
    return element.node['content'] === ''
  }
}
