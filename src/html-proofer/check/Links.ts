import {Check} from '../Check'
import {ICheck, ICheckResult} from "../../interfaces";
import {Element} from "../Element";

export class Links extends Check {
  EMAIL_REGEXP = /^\S+@\S+\.\S+$/

  public run(): ICheckResult {
    const nodes = []
    for (const node of this.html.css('a, link, source')) {
      const link = this.createElement(node)

      if (link.ignore()) {
        continue
      }

      if (!this.allow_hash_href() && link.node.attributes.href === '#') {
        this.addFailure('linking to internal hash #, which points to nowhere', link.line, null, link.content)
        continue
      }

      // is there even a href?
      if (!link.url.rawAttribute) {
        if (this.allow_missing_href()) {
          continue
        }

        this.addFailure(`'${link.node.name}' tag is missing a reference`, link.line, null, link.content)
        continue
      }
      // is it even a valid URL?
      if (!link.url.valid()) {
        this.addFailure(`${link.href} is an invalid URL`, link.line, null, link.content)
        continue
      }

      this.check_schemes(link)

      // intentionally down here because we still want valid? & missing_href? to execute
      if (link.url.isNonHttpRemote()) {
        continue
      }

      if (!link.url.internal && link.url.remote()) {
        if (this.runner.checkSriOption() && link.isLinkTag()) {
          this.check_sri(link)
        }

        // we need to skip these for now; although the domain main be valid,
        // curl/Typheous inaccurately return 404s for some links. cc https://git.io/vyCFx
        if (link.node.attributes.rel === 'dns-prefetch') {
          continue
        }

        if (!link.url.is_path()) {
          this.addFailure(`${link.url.rawAttribute} is an invalid URL`, link.line, null, link.content)
          continue
        }

        this.addToExternalUrls(link.url, link.line)
      } else if (link.url.internal) {
        // does the local directory have a trailing slash?
        if (link.url.unslashed_directory(link.url.absolute_path)) {
          this.addFailure(`internally linking to a directory ${link.url.rawAttribute} without trailing slash`,
            link.line, null, link.content)
          continue
        }
        this.addToInternalUrls(link.url, link.line)
      }
    }

    return {
      externalUrls: this.externalUrls,
      internalUrls: this.internalUrls,
      failures: this.failures
    }
  }

  allow_missing_href() {
    return this.runner.options.allow_missing_href
  }

  allow_hash_href() {
    return this.runner.options.allow_hash_href
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
        this.addFailure(`${link.url.rawAttribute} is not an HTTPS link`, link.line, null, link.content)
    }
  }

  handle_mailto(link: Element) {
    if (!link.url.path) {
      if (!this.ignore_empty_mailto()) {
        this.addFailure(`${link.url.rawAttribute} contains no email address`, link.line, null, link.content)
      }
    } else {
      const mailto = decodeURI(link.url.path)
      const recipients = mailto.split(/[;,]/).map(e => e.trim())
      recipients.forEach(email => {
        if (!email.match(this.EMAIL_REGEXP)) {
          this.addFailure(`${link.url.rawAttribute} contains an invalid email address`, link.line, null, link.content)
        }
        return false // we need to find only first broken email as we don't want to create multiple failures
      })
    }
  }

  handle_tel(link: Element) {
    if (!link.url.path) {
      this.addFailure(`${link.url.rawAttribute} contains no phone number`, link.line, null, link.content)
    }
  }

  ignore_empty_mailto() {
    return this.runner.options.ignore_empty_mailto
  }

  // Allowed elements from Subresource Integrity specification
  // https://w3c.github.io/webappsec-subresource-integrity/#link-element-for-stylesheets
  SRI_REL_TYPES = ['stylesheet']

  check_sri(link: Element) {
    if (!this.SRI_REL_TYPES.includes(link.node.attributes.rel)) {
      return
    }

    if ((!link.node.attributes.integrity) && (!link.node.attributes.crossorigin)) {
      this.addFailure(`SRI and CORS not provided in: ${link.url.rawAttribute}`, link.line, null, link.content)
    } else if (!link.node.attributes.integrity) {
      this.addFailure(`Integrity is missing in: ${link.url.rawAttribute}`, link.line, null, link.content)
    } else if (!link.node.attributes.crossorigin) {
      this.addFailure(`CORS not provided for external resource in: ${link.url.rawAttribute}`, link.line, null, link.content)
    }
  }

}
