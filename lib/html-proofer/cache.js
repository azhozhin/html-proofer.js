export class Cache {

  constructor(runner, options) {
    this.runner = runner
    this.logger = runner.logger
    this.options = options
  }

  add_internal(url, metadata, found) {
    if (!this.enabled()) {
      return
    }
    // todo
  }

  add_external(url, filenames, status_code, msg) {
    if (!this.enabled()) {
      return
    }
    // todo
  }

  write() {
    if (!this.enabled()) {
      return
    }
    // todo
  }

  enabled() {
    return this.options['cache'] != null
  }
}