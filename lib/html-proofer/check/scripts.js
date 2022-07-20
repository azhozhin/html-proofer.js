import {Check} from '../check.js'
import {isNullOrEmpty} from '../utils.js'

export class Scripts extends Check {
  run() {
    this.html.css('script').each((i, node) => {
      this.script = this.create_element(node)

      if (this.script.ignore()) {
        return
      }

      if (!isNullOrEmpty(this.script.content.trim())) {
        return
      }

      //# does the script exist?
      if (this.missing_src()) {
        this.add_failure('script is empty and has no src attribute', this.script.line, null, this.script.content)
      } else if (this.script.url.remote()) {
        this.add_to_external_urls(this.script.src, this.script.line)
        if (this.runner.check_sri()) {
          this.check_sri()
        }
      } else if (!this.script.url.exists()) {
        this.add_failure(`internal script reference ${this.script.src} does not exist`, this.script.line, null,
            this.script.content)
      }

    })
    return this.external_urls

  }

  missing_src() {
    return this.script.node['src'] == undefined
  }

  check_sri() {
    if (isNullOrEmpty(this.script.node['integrity']) && isNullOrEmpty(this.script.node['crossorigin'])) {
      this.add_failure(`SRI and CORS not provided in: #{@script.url.raw_attribute}`, this.script.line, null,
          this.script.content)
    } else if (isNullOrEmpty(this.script.node['integrity'])) {
      this.add_failure(`Integrity is missing in: #{@script.url.raw_attribute}`, this.script.line, null,
          this.script.content)
    } else if (isNullOrEmpty(this.script.node['crossorigin'])) {
      this.add_failure(`CORS not provided for external resource in: #{@script.url.raw_attribute}`, this.script.line,
          null, this.script.content)
    }
  }

}