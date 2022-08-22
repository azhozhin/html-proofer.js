import {Check} from '../Check'
import {Element} from "../Element";
import {ICheckResult} from "../../interfaces";

export class OpenGraph extends Check {

  public run():ICheckResult {
    for (const node of this.html.css('meta[property="og:url"], meta[property="og:image"]')) {
      const openGraph = this.createElement(node)

      if (openGraph.ignore()) {
        continue
      }

      // does the openGraph exist?
      if (this.isMissingContentAttribute(openGraph)) {
        this.addFailure('open graph has no content attribute', openGraph.line, null, openGraph.content)
      } else if (this.isEmptyContentAttribute(openGraph)) {
        this.addFailure('open graph content attribute is empty', openGraph.line, null, openGraph.content)
      } else if (!openGraph.url.valid()) {
        this.addFailure(`${openGraph.src} is an invalid URL`, openGraph.line)
      } else if (openGraph.url.remote()) {
        this.addToExternalUrls(openGraph.url, openGraph.line)
      } else {
        if (!openGraph.url.exists()) {
          this.addFailure(`internal open graph ${openGraph.url.rawAttribute} does not exist`,
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

  isMissingContentAttribute(element:Element) {
    return element.node.attributes.content == null
  }

  isEmptyContentAttribute(element:Element) {
    return element.node.attributes.content === ''
  }
}
