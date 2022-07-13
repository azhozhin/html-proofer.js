import {Failure} from "./failure";

export class Runner {
    constructor(src, opts = {}) {
    }

    get failed_checks(){
        // todo
        return [new Failure(null, null, "internally linking to ../images/missing_image_alt.html#asdfasfdkafl; the file exists, but the hash 'asdfasfdkafl' does not")]
    }

    run() {
        return;
    }
}