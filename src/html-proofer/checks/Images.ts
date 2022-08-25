import {Check} from './Check'
import {Url} from '../Url'
import {isNullOrEmpty} from '../Utils'
import {Element} from '../Element'

export class Images extends Check {
  SCREEN_SHOT_REGEX = /Screen(?: |%20)Shot(?: |%20)\d+-\d+-\d+(?: |%20)at(?: |%20)\d+.\d+.\d+/

  internalRun(): void {
    for (const node of this.html.css('img')) {
      const img = this.createElement(node)

      if (img.isIgnore()) {
        continue
      }

      // screenshot filenames should return because of terrible names
      if (this.isTerribleFilename(img)) {
        this.addFailure(`image has a terrible filename (${img.url.rawAttribute})`, img.line, null, img.content)
      }

      // does the image exist?
      if (this.isMissingSrc(img)) {
        this.addFailure('image has no src or srcset attribute', img.line, null, img.content)
      } else if (img.url.isRemote()) {
        this.addToExternalUrls(img.url, img.line)
      } else if (!img.url.exists() && !img.isMultipleSrcsets()) {
        this.addFailure(`internal image ${img.url.rawAttribute} does not exist`, img.line, null, img.content)
      } else if (img.isMultipleSrcsets()) {
        this.processMultipleSrcSets(img)
      }

      if (!this.isIgnoreElement(img)) {
        this.checkAltAttribute(img)
      }
      this.checkScheme(img)
    }
  }

  private checkScheme(img: Element) {
    if (img.url.isHttp() && this.runner.options.enforce_https) {
      this.addFailure(`image ${img.url.rawAttribute} uses the http scheme`, img.line, null, img.content)
    }
  }

  private checkAltAttribute(img: Element) {
    if (this.isMissingAltAttribute(img) && !this.runner.options.ignore_missing_alt) {
      this.addFailure(`image ${img.url.rawAttribute} does not have an alt attribute`, img.line, null, img.content)
    } else if (this.isEmptyAlt(img) && !this.runner.options.ignore_empty_alt) {
      this.addFailure(`image ${img.url.rawAttribute} has an alt attribute, but no content`, img.line, null, img.content)
    }
  }

  private isEmptyAlt(img: Element) {
    return this.isEmptyAltAttribute(img) || this.isAltAttributeAllSpaces(img)
  }

  private processMultipleSrcSets(img: Element) {
    const srcsets = img.srcset!.split(',').map((x: string) => x.trim())
    for (const srcset of srcsets) {
      const srcsetUrl = new Url(this.runner, srcset, img.baseUrl)

      if (srcsetUrl.isRemote()) {
        this.addToExternalUrls(srcsetUrl, img.line)
      } else if (!srcsetUrl.exists()) {
        this.addFailure(`internal image ${srcset} does not exist`, img.line, null, img.content)
      }
    }
  }

  private isIgnoreElement(img: Element): boolean {
    return img.url.isIgnore() || img.isAriaHidden()
  }

  private isMissingAltAttribute(img: Element): boolean {
    return img.node.attributes.alt == null
  }

  private isEmptyAltAttribute(img: Element): boolean {
    return !this.isMissingAltAttribute(img) && img.node.attributes.alt === ''
  }

  private isAltAttributeAllSpaces(img: Element): boolean {
    return !this.isMissingAltAttribute(img) && img.node.attributes.alt.trim() === ''
  }

  private isTerribleFilename(img: Element): boolean {
    const u = img.url.toString()
    return u ? u.match(this.SCREEN_SHOT_REGEX) != null : false
  }

  private isMissingSrc(img: Element): boolean {
    return isNullOrEmpty(img.url.toString())
  }
}
