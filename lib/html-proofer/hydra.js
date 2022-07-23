import axios from 'axios'
import {hasUnicode} from './utils.js'

export class Hydra {

  constructor() {
    this.requests = []
  }

  async run() {

    for (const request of this.requests) {
      // axios expects protocol (http/https) and rejects urls without it, so we need to fix urls for it
      const fixedUrl = request.url.slice(0, 4).toLowerCase() !== 'http' ? 'http://' + request.url : request.url
      const config = {
        url: hasUnicode(fixedUrl) ? encodeURI(fixedUrl) : fixedUrl,
        method: request.options['method'],
        timeout: 5000,

        headers: request.options['headers'],

        // we need promise to be resolved anyway
        validateStatus: function(status) {
          return true
        },
      }

      await axios.request(config).
          then(response => request.on_complete(response)).
          catch(error => request.on_error(error))
    }
  }

  queue(request) {
    this.requests.push(request)
  }
}