import {Check} from '../Check'
import {Element} from '../Element'

export class OpenGraph extends Check {

  internalRun(): void {
    for (const node of this.html.css('meta[property="og:url"], meta[property="og:image"]')) {
      const openGraph = this.createElement(node)

      if (openGraph.isIgnore()) {
        continue
      }

      // does the openGraph exist?
      if (this.isMissingContentAttribute(openGraph)) {
        this.addFailure('open graph has no content attribute', openGraph.line, null, openGraph.content)
      } else if (this.isEmptyContentAttribute(openGraph)) {
        this.addFailure('open graph content attribute is empty', openGraph.line, null, openGraph.content)
      } else if (!openGraph.url.isValid()) {
        this.addFailure(`${openGraph.src} is an invalid URL`, openGraph.line)
      } else if (openGraph.url.isRemote()) {
        this.addToExternalUrls(openGraph.url, openGraph.line)
      } else {
        if (!openGraph.url.exists()) {
          this.addFailure(`internal open graph ${openGraph.url.rawAttribute} does not exist`,
              openGraph.line, null, openGraph.content)
        }
      }
    }
  }

  isMissingContentAttribute(element:Element) {
    return element.node.attributes.content == null
  }

  isEmptyContentAttribute(element:Element) {
    return element.node.attributes.content === ''
  }
}
