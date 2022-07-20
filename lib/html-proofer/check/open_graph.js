import {Check} from '../check.js'

export class OpenGraph extends Check {

  run() {
    this.html.css('meta[property="og:url"], meta[property="og:image"]').each((i, node) => {
      this.open_graph = this.create_element(node)

      if (this.open_graph.ignore()) {
        return
      }

      //does the open_graph exist?
      if (this.missing_content()) {
        this.add_failure('open graph has no content attribute', this.open_graph.line, null, this.open_graph.content)
      } else if (this.empty_content()) {
        this.add_failure('open graph content attribute is empty', this.open_graph.line, null, this.open_graph.content)
      } else if (!this.open_graph.url.valid()) {
        this.add_failure(`${this.open_graph.src} is an invalid URL`, this.open_graph.line)
      } else if (this.open_graph.url.remote()) {
        this.add_to_external_urls(this.open_graph.url, this.open_graph.line)
      } else {
        if (!this.open_graph.url.exists()) {
          this.add_failure(`internal open graph ${this.open_graph.url.raw_attribute} does not exist`,
              this.open_graph.line, null, this.open_graph.content)
        }
      }
    })
    return this.external_urls
  }

  missing_content() {
    return this.open_graph.node['content'] == null
  }

  empty_content() {
    return this.open_graph.node['content'] === ''
  }
}