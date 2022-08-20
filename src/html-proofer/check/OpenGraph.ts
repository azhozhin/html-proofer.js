import {Check} from '../Check'
import {Element} from "../Element";
import {ICheckResult} from "../../interfaces";

export class OpenGraph extends Check {

  public run():ICheckResult {
    for (const node of this.html.css('meta[property="og:url"], meta[property="og:image"]')) {
      const openGraph = this.create_element(node)

      if (openGraph.ignore()) {
        continue
      }

      // does the openGraph exist?
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
          this.add_failure(`internal open graph ${openGraph.url.rawAttribute} does not exist`,
              openGraph.line, null, openGraph.content)
        }
      }
    }

    return {
      externalUrls: this.externalUrls,
      internalUrls: this.internalUrls,
      failures: this.failures
    }
  }

  missing_content(element:Element) {
    return element.node.attributes['content'] == null
  }

  empty_content(element:Element) {
    return element.node.attributes['content'] === ''
  }
}
