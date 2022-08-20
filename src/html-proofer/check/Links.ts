import {Check} from '../Check'
import {ICheck} from "../../interfaces/ICheck";
import {Element} from "../Element";

export class Links extends Check implements ICheck {
  EMAIL_REGEXP = /^\S+@\S+\.\S+$/

  public run() {
    const nodes = []
    this.html.css('a, link, source').each((i: number, node: any) => {
      const link = this.create_element(node)

      if (link.ignore()) {
        return
      }

      if (!this.allow_hash_href() && link.node['href'] === '#') {
        this.add_failure('linking to internal hash #, which points to nowhere', link.line, null, link.content)
        return
      }

      // is there even a href?
      if (!link.url.raw_attribute) {
        if (this.allow_missing_href()) {
          return
        }

        this.add_failure(`'${link.node.name}' tag is missing a reference`, link.line, null, link.content)
        return
      }
      // is it even a valid URL?
      if (!link.url.valid()) {
        this.add_failure(`${link.href} is an invalid URL`, link.line, null, link.content)
        return
      }

      this.check_schemes(link)

      // intentionally down here because we still want valid? & missing_href? to execute
      if (link.url.non_http_remote()) {
        return
      }

      if (!link.url.internal && link.url.remote()) {
        if (this.runner.check_sri() && link.link_tag()) {
          this.check_sri(link)
        }

        // we need to skip these for now; although the domain main be valid,
        // curl/Typheous inaccurately return 404s for some links. cc https://git.io/vyCFx
        if (link.node['rel'] == 'dns-prefetch') {
          return
        }

        if (!link.url.is_path()) {
          this.add_failure(`${link.url.raw_attribute} is an invalid URL`, link.line, null, link.content)
          return
        }

        this.add_to_external_urls(link.url, link.line)
      } else if (link.url.internal) {
        // does the local directory have a trailing slash?
        if (link.url.unslashed_directory(link.url.absolute_path)) {
          this.add_failure(`internally linking to a directory ${link.url.raw_attribute} without trailing slash`,
            link.line, null, link.content)
          return
        }
        this.add_to_internal_urls(link.url, link.line)
      }
    })
  }

  allow_missing_href() {
    return this.runner.options['allow_missing_href']
  }

  allow_hash_href() {
    return this.runner.options['allow_hash_href']
  }

  check_schemes(link: Element) {
    switch (link.url.scheme) {
      case 'mailto':
        this.handle_mailto(link)
        break
      case 'tel':
        this.handle_tel(link)
        break
      case 'http':
        if (!this.runner.options.enforce_https) {
          return
        }
        this.add_failure(`${link.url.raw_attribute} is not an HTTPS link`, link.line, null, link.content)
    }
  }

  handle_mailto(link: Element) {
    if (!link.url.path) {
      if (!this.ignore_empty_mailto()) {
        this.add_failure(`${link.url.raw_attribute} contains no email address`, link.line, null, link.content)
      }
    } else {
      const mailto = decodeURI(link.url.path)
      const recipients = mailto.split(/[;,]/).map(e => e.trim())
      recipients.forEach(email => {
        if (!email.match(this.EMAIL_REGEXP)) {
          this.add_failure(`${link.url.raw_attribute} contains an invalid email address`, link.line, null, link.content)
        }
        return false // we need to find only first broken email as we don't want to create multiple failures
      })
    }
  }

  handle_tel(link: Element) {
    if (!link.url.path) {
      this.add_failure(`${link.url.raw_attribute} contains no phone number`, link.line, null, link.content)
    }
  }

  ignore_empty_mailto() {
    return this.runner.options['ignore_empty_mailto']
  }

  // Allowed elements from Subresource Integrity specification
  // https://w3c.github.io/webappsec-subresource-integrity/#link-element-for-stylesheets
  SRI_REL_TYPES = ['stylesheet']

  check_sri(link: Element) {
    if (!this.SRI_REL_TYPES.includes(link.node['rel'])) {
      return
    }

    if ((!link.node['integrity']) && (!link.node['crossorigin'])) {
      this.add_failure(`SRI and CORS not provided in: ${link.url.raw_attribute}`, link.line, null, link.content)
    } else if (!link.node['integrity']) {
      this.add_failure(`Integrity is missing in: ${link.url.raw_attribute}`, link.line, null, link.content)
    } else if (!link.node['crossorigin']) {
      this.add_failure(`CORS not provided for external resource in: ${link.url.raw_attribute}`, link.line, null, link.content)
    }
  }

  source_tag(link: Element): boolean {
    return link.node.name === 'source'
  }

  anchor_tag(link: Element): boolean {
    return link.node.name === 'a'
  }

}
