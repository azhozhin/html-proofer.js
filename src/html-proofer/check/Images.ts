import {Check} from '../Check'
import {Url} from '../attribute/Url'
import {isNullOrEmpty} from '../Utils'
import {Element} from "../Element";
import {ICheckResult} from "../../interfaces";

export class Images extends Check {
  SCREEN_SHOT_REGEX = /Screen(?: |%20)Shot(?: |%20)\d+-\d+-\d+(?: |%20)at(?: |%20)\d+.\d+.\d+/

  public run(): ICheckResult {
    for (const node of this.html.css('img')){
      const img = this.create_element(node)

      if (img.ignore()) {
        continue
      }

      // screenshot filenames should return because of terrible names
      if (this.terrible_filename(img)) {
        this.add_failure(`image has a terrible filename (${img.url.rawAttribute})`, img.line, null, img.content)
      }

      // does the image exist?
      if (this.missing_src(img)) {
        this.add_failure('image has no src or srcset attribute', img.line, null, img.content)
      } else if (img.url.remote()) {
        this.add_to_external_urls(img.url, img.line)
      } else if (!img.url.exists() && !img.isMultipleSrcsets()) {
        this.add_failure(`internal image ${img.url.rawAttribute} does not exist`, img.line, null, img.content)
      } else if (img.isMultipleSrcsets()) {
        const srcsets = img.srcset!.split(',').map((x: string) => x.trim())
        for (const srcset of srcsets) {
          const srcsetUrl = new Url(this.runner, srcset, img.baseUrl)

          if (srcsetUrl.remote()) {
            this.add_to_external_urls(srcsetUrl, img.line)
          } else if (!srcsetUrl.exists()) {
            this.add_failure(`internal image ${srcset} does not exist`, img.line, null, img.content)
          }
        }
      }

      if (!this.isIgnoreElement(img)) {
        if (this.isMissingAltAttribute(img) && !this.ignoreMissingAltAttributeOption()) {
          this.add_failure(`image ${img.url.rawAttribute} does not have an alt attribute`, img.line, null, img.content)
        } else if ((this.isEmptyAltAttribute(img) || this.alt_all_spaces(img)) && !this.ignoreEmptyAltAttributeOption()) {
          this.add_failure(`image ${img.url.rawAttribute} has an alt attribute, but no content`, img.line, null, img.content)
        }
      }
      if (this.runner.enforceHttpsOption() && img.url.http()) {
        this.add_failure(`image ${img.url.rawAttribute} uses the http scheme`, img.line, null, img.content)
      }
    }

    return {
      externalUrls: this.externalUrls,
      internalUrls: this.internalUrls,
      failures: this.failures
    }
  }

  private ignoreMissingAltAttributeOption(): boolean {
    return this.runner.options.ignore_missing_alt || false
  }

  private ignoreEmptyAltAttributeOption(): boolean {
    return this.runner.options.ignore_empty_alt || false
  }

  private isIgnoreElement(img: Element): boolean {
    return img.url.ignore() || img.isAriaHidden()
  }

  isMissingAltAttribute(img: Element): boolean {
    return img.node.attributes.alt == null
  }

  isEmptyAltAttribute(img: Element): boolean {
    return !this.isMissingAltAttribute(img) && img.node.attributes.alt === ''
  }

  alt_all_spaces(img: Element): boolean {
    return !this.isMissingAltAttribute(img) && img.node.attributes.alt.trim() === ''
  }

  terrible_filename(img: Element): boolean {
    const u = img.url.toString()
    return u ? u.match(this.SCREEN_SHOT_REGEX) != null : false
  }

  missing_src(img: Element): boolean {
    return isNullOrEmpty(img.url.toString())
  }
}
