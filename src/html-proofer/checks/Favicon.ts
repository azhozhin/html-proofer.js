import {Check} from './Check'
import {Element} from '../Element'
import {last} from '../Utils'

export class Favicon extends Check {
  internalRun():void {
    let found = false
    let el: Element | null = null
    for (const node of this.html.css('link')) {
      el = this.createElement(node)

      if (el.isIgnore()) {
        continue
      }

      found = last(el.node.attributes.rel.split(' ')) === 'icon'
      if (found) {
        break
      }
    }

    if (this.immediate_redirect()) {
      // do nothing
    } else {
      if (found) {
        if (el!.url.isRemote()) {
          this.addToExternalUrls(el!.url, el!.line)
        } else if (!el!.url.exists()) {
          this.addFailure(`internal favicon ${el!.url.rawAttribute} does not exist`, el!.line, null, el!.content)
        }
      } else {
        this.addFailure('no favicon provided')
      }
    }
  }

  // allow any instant-redirect meta tag
  immediate_redirect() {
    const content = this.html.css('meta[http-equiv="refresh"]')
    if (!content || content.length === 0) {
      return false
    }

    // todo: inconsistent API
    return content[0].attributes.content.startsWith('0;')
  }
}
