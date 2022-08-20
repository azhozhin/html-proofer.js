var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import * as http from 'node:http';
import * as https from 'node:https';
export class Hydra {
    constructor(logger) {
        this.requestVerboseInterceptor = null;
        this.responseVerboseInterceptor = null;
        this.requests = [];
        this.logger = logger;
    }
    injectVerboseInterceptors() {
        this.requestVerboseInterceptor = axios.interceptors.request.use(request => {
            this.logger.log('info', `Request:
      ${JSON.stringify(request, null, 2)}`);
            return request;
        });
        this.responseVerboseInterceptor = axios.interceptors.response.use(response => {
            const resp = serialize(response);
            this.logger.log('info', `Response:
      ${JSON.stringify(resp, null, 2)}`);
            return response;
        });
    }
    ejectVerboseInterceptors() {
        axios.interceptors.request.eject(this.requestVerboseInterceptor);
        axios.interceptors.response.eject(this.responseVerboseInterceptor);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const http_agent = new http.Agent();
            const https_insecure_agent = new https.Agent({
                rejectUnauthorized: false,
            });
            const https_secure_agent = new https.Agent();
            for (const request of this.requests) {
                // axios expects protocol (http/https) and rejects urls without it, so we need to fix urls for it
                const fixedUrl = request.url.slice(0, 4).toLowerCase() !== 'http' ? 'http://' + request.url : request.url;
                let https_agent = (request.options['ssl_verifypeer'] != null && request.options['ssl_verifypeer'] === false)
                    ? https_insecure_agent
                    : https_secure_agent;
                const url = new URL(fixedUrl); // for unicode urls it should be converted to punycode
                const config = {
                    url: url.toString(),
                    method: request.options['method'],
                    timeout: 30000,
                    headers: request.options['headers'],
                    maxRedirects: request.options.followlocation ? 50 : 0,
                    // we need promise to be resolved anyway
                    validateStatus: function (status) {
                        return true;
                    },
                    httpAgent: http_agent,
                    httpsAgent: https_agent,
                };
                if (request.options.verbose) {
                    this.injectVerboseInterceptors();
                }
                yield axios.request(config).
                    then(response => request.on_complete(response)).
                    catch(error => request.on_error(error));
                if (request.options.verbose) {
                    this.ejectVerboseInterceptors();
                }
            }
        });
    }
    queue(request) {
        this.requests.push(request);
    }
}
function serialize(response) {
    let meta = {
        url: response.config.url,
        method: response.config.method,
        data: response.config.data,
        headers: response.config.headers,
    };
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
    };
}
