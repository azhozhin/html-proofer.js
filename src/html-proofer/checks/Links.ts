import {Check} from './Check'
import {Element} from '../Element'

export class Links extends Check {
  private EMAIL_REGEXP = /^\S+@\S+\.\S+$/
  private SRI_REL_TYPES = ['stylesheet']

  internalRun(): void {
    for (const node of this.html.css('a, link, source')) {
      const link = this.createElement(node)

      if (link.isIgnore()) {
        continue
      }

      if (this.checkInternalHash(link)) {
        continue
      }

      // is there even a href?
      if (this.checkHref(link)) {
        continue
      }

      // is it even a valid URL?
      if (!link.url.isValid()) {
        this.addFailure(`${link.href} is an invalid URL`, link.line, null, link.content)
        continue
      }

      this.checkSchemes(link)

      // intentionally down here because we still want valid? & missing_href? to execute
      if (link.url.isNonHttpRemote()) {
        continue
      }

      if (link.url.isRemote() && !link.url.isInternal()) {
        this.processRemoteLink(link)
      } else if (link.url.isInternal()) {
        this.processInternalLink(link)
      }
    }
  }

  private processInternalLink(link: Element) {
    // does the local directory have a trailing slash?
    if (link.url.isUnslashedDirectory(link.url.absolutePath)) {
      this.addFailure(`internally linking to a directory ${link.url.rawAttribute} without trailing slash`, link.line, null, link.content)
      return
    }
    this.addToInternalUrls(link.url, link.line)
  }

  private processRemoteLink(link: Element) {
    if (this.runner.options.check_sri && link.isLinkTag()) {
      this.checkSri(link)
    }

    // we need to skip these for now; although the domain main be valid,
    // curl/Typheous inaccurately return 404s for some links. cc https://git.io/vyCFx
    if (link.node.attributes.rel === 'dns-prefetch') {
      return
    }

    if (!link.url.isPath()) {
      this.addFailure(`${link.url.rawAttribute} is an invalid URL`, link.line, null, link.content)
      return
    }

    this.addToExternalUrls(link.url, link.line)
  }

  private checkSchemes(link: Element) {
    switch (link.url.scheme) {
      case 'mailto':
        this.handleMailto(link)
        break
      case 'tel':
        this.handleTel(link)
        break
      case 'http':
        if (!this.runner.options.enforce_https) {
          return
        }
        this.addFailure(`${link.url.rawAttribute} is not an HTTPS link`, link.line, null, link.content)
        break
    }
  }

  private handleMailto(link: Element) {
    if (!link.url.path) {
      if (!this.runner.options.ignore_empty_mailto) {
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

  private handleTel(link: Element) {
    if (!link.url.path) {
      this.addFailure(`${link.url.rawAttribute} contains no phone number`, link.line, null, link.content)
    }
  }

  // Allowed elements from Subresource Integrity specification
  // https://w3c.github.io/webappsec-subresource-integrity/#link-element-for-stylesheets


  private checkSri(link: Element) {
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

  private checkInternalHash(link: Element) : boolean {
    if (link.node.attributes.href === '#' && !this.runner.options.allow_hash_href) {
      this.addFailure('linking to internal hash #, which points to nowhere', link.line, null, link.content)
      return true
    }
    return false
  }

  private checkHref(link: Element): boolean {
    if (!link.url.rawAttribute) {
      if (this.runner.options.allow_missing_href) {
        return true
      }

      this.addFailure(`'${link.node.name}' tag is missing a reference`, link.line, null, link.content)
      return true
    }
    return false
  }
}
