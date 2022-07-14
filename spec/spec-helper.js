import {HTMLProofer} from "../lib/html-proofer";

export let FIXTURES_DIR = 'spec/html-proofer/fixtures';

let make_proofer = function (item, type, opts) {
    switch (type) {
        case 'file':
            return HTMLProofer.check_file(item, opts)
        case 'directory':
            return HTMLProofer.check_directory(item, opts)
        case 'directories':
            return HTMLProofer.check_directories(item, opts)
        case 'links':
            return HTMLProofer.check_links(item, opts)
    }
}

export function run_proofer(item, type, opts) {
    const proofer = make_proofer(item, type, opts)
    //cassette_name = make_cassette_name(item, opts)
    //VCR.use_cassette(cassette_name, record: :new_episodes) do
    //    capture_stderr { proofer.run }
    proofer.run()
    return proofer
}

// Simulation of Ruby
Object.defineProperty(Array.prototype, "last", {
    get: function last(){
        return this[this.length - 1];
    }
})

Object.defineProperty(Array.prototype, "first", {
    get: function first(){
        return this[0];
    }
})

Array.prototype.extend = function (array) {
    array.forEach(this.push, this);
}