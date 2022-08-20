import axios, {AxiosResponse} from 'axios'
import * as http from 'node:http';
import * as https from 'node:https'
import {ILogger, IExternalRequest} from "../interfaces";

export class Hydra {
  private logger: ILogger;
  private requests: Array<IExternalRequest>;
  private requestVerboseInterceptor: number | null = null
  private responseVerboseInterceptor: number | null = null

  constructor(logger:ILogger) {
    this.requests = []
    this.logger = logger
  }

  injectVerboseInterceptors() {
    this.requestVerboseInterceptor = axios.interceptors.request.use(request => {
      this.logger.log('info',`Request:
      ${JSON.stringify(request, null, 2)}`)
      return request
    })

    this.responseVerboseInterceptor = axios.interceptors.response.use(response => {
      const resp = serialize(response)
      this.logger.log('info', `Response:
      ${JSON.stringify(resp, null, 2)}`)
      return response
    })
  }

  ejectVerboseInterceptors() {
    axios.interceptors.request.eject(this.requestVerboseInterceptor!)
    axios.interceptors.response.eject(this.responseVerboseInterceptor!)
  }

  async run() {

    const http_agent = new http.Agent()
    const https_insecure_agent = new https.Agent({
      rejectUnauthorized: false,
    })
    const https_secure_agent = new https.Agent()

    for (const request of this.requests) {
      // axios expects protocol (http/https) and rejects urls without it, so we need to fix urls for it
      const fixedUrl = request.url.slice(0, 4).toLowerCase() !== 'http' ? 'http://' + request.url : request.url
      let https_agent = (request.options['ssl_verifypeer'] != null && request.options['ssl_verifypeer'] === false)
          ? https_insecure_agent
          : https_secure_agent

      const url = new URL(fixedUrl) // for unicode urls it should be converted to punycode
      const config = {
        url: url.toString(),
        method: request.options['method'],
        timeout: 30000,

        headers: request.options['headers'],
        maxRedirects: request.options.followlocation ? 50 : 0,
        // we need promise to be resolved anyway
        validateStatus: function(status:any) {
          return true
        },
        httpAgent: http_agent,
        httpsAgent: https_agent,
      }

      if (request.options.verbose) {
        this.injectVerboseInterceptors()
      }

      await axios.request(config).
          then(response => request.on_complete(response)).
          catch(error => request.on_error(error))

      if (request.options.verbose) {
        this.ejectVerboseInterceptors()
      }
    }
  }

  queue(request:IExternalRequest) {
    this.requests.push(request)
  }
}

function serialize(response: AxiosResponse<any, any>) {
  let meta = {
    url: response.config.url,
    method: response.config.method,
    data: response.config.data,
    headers: response.config.headers,
  }

  return {
    meta: meta,
    fixture: true,

    originalResponseData: {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      //config: meta,
    },
  }
}
