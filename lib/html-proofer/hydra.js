import axios from 'axios'
import {hasUnicode} from './utils.js'
import {Agent} from 'https'

export class Hydra {

  constructor() {
    this.requests = []
  }

  async run() {

    const insecure_agent = new Agent({
      rejectUnauthorized: false,
    })
    const secure_agent = new Agent()

    for (const request of this.requests) {
      // axios expects protocol (http/https) and rejects urls without it, so we need to fix urls for it
      const fixedUrl = request.url.slice(0, 4).toLowerCase() !== 'http' ? 'http://' + request.url : request.url
      let agent = (request.options['ssl_verifypeer'] != null && request.options['ssl_verifypeer'] === false)
          ? insecure_agent
          : secure_agent

      const url = new URL(fixedUrl) // for unicode urls it should be converted to punycode
      const config = {
        url: url.toString(),
        method: request.options['method'],
        timeout: 30000,

        headers: request.options['headers'],
        maxRedirects: request.options.followlocation ? 10 : 0,
        // we need promise to be resolved anyway
        validateStatus: function(status) {
          return true
        },
        httpsAgent: agent,
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