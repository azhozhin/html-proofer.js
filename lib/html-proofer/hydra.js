import axios from "axios";

export class Hydra{

    constructor() {
        this.requests = []
    }

    async run() {
        for (const request of this.requests) {
            const config = {
                url: request.url,
                method: request.options['method'],

                // we need promise to be resolved anyway
                validateStatus: function (status) {
                    return true
                }
            }

            await axios.request(config)
                .then(response => request.on_complete(response))
                .catch(error=>request.on_error(error))
        }
    }

    queue(request) {
        this.requests.push(request)
    }
}