import {Check} from '../Check'
import {isNullOrEmpty} from '../Utils'
import {Element} from "../Element";

export class Scripts extends Check {
  run() {
    this.html.css('script').each((i:number, node:any) => {
      const script = this.create_element(node)

      if (script.ignore()) {
        return
      }

      if (!isNullOrEmpty(script.content.trim())) {
        return
      }

      //# does the script exist?
      if (this.missing_src(script)) {
        this.add_failure('script is empty and has no src attribute', script.line, null, script.content)
      } else if (script.url.remote()) {
        this.add_to_external_urls(script.src, script.line)
        if (this.runner.check_sri()) {
          this.check_sri(script)
        }
      } else if (!script.url.exists()) {
        this.add_failure(`internal script reference ${script.src} does not exist`, script.line, null, script.content)
      }
    })
    return this.external_urls

  }

  missing_src(script: Element): boolean {
    return script.node['src'] == undefined
  }

  check_sri(script: Element) {
    if (isNullOrEmpty(script.node['integrity']) && isNullOrEmpty(script.node['crossorigin'])) {
      this.add_failure(`SRI and CORS not provided in: #{@script.url.raw_attribute}`, script.line, null, script.content)
    } else if (isNullOrEmpty(script.node['integrity'])) {
      this.add_failure(`Integrity is missing in: #{@script.url.raw_attribute}`, script.line, null, script.content)
    } else if (isNullOrEmpty(script.node['crossorigin'])) {
      this.add_failure(`CORS not provided for external resource in: #{@script.url.raw_attribute}`, script.line, null, script.content)
    }
  }

}
