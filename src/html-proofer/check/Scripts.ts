import {Check} from '../Check'
import {isNullOrEmpty} from '../Utils'
import {Element} from "../Element";
import {ICheckResult} from "../../interfaces";

export class Scripts extends Check {
  public run(): ICheckResult {
    for (const node of this.html.css('script')) {
      const script = this.createElement(node)

      if (script.isIgnore()) {
        continue
      }

      if (!isNullOrEmpty(script.content)) {
        continue
      }

      // does the script exist?
      if (this.isMissingSrc(script)) {
        this.addFailure('script is empty and has no src attribute', script.line, null, script.content)
      } else if (script.url.isRemote()) {
        this.addToExternalUrls(script.src, script.line)
        if (this.runner.options.check_sri) {
          this.check_sri(script)
        }
      } else if (!script.url.exists()) {
        this.addFailure(`internal script reference ${script.src} does not exist`, script.line, null, script.content)
      }
    }

    return {
      externalUrls: this.externalUrls,
      internalUrls: this.internalUrls,
      failures: this.failures
    }
  }

  isMissingSrc(script: Element): boolean {
    return script.node.attributes.src === undefined
  }

  check_sri(script: Element) {
    if (isNullOrEmpty(script.node.attributes.integrity) && isNullOrEmpty(script.node.attributes.crossorigin)) {
      this.addFailure(`SRI and CORS not provided in: ${script.url.rawAttribute}`, script.line, null, script.content)
    } else if (isNullOrEmpty(script.node.attributes.integrity)) {
      this.addFailure(`Integrity is missing in: ${script.url.rawAttribute}`, script.line, null, script.content)
    } else if (isNullOrEmpty(script.node.attributes.crossorigin)) {
      this.addFailure(`CORS not provided for external resource in: ${script.url.rawAttribute}`, script.line, null, script.content)
    }
  }

}
