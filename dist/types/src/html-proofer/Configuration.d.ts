import { Links } from './check/Links';
import { Scripts } from './check/Scripts';
import { Images } from './check/Images';
import { IOptions } from "../interfaces";
export declare class Configuration {
    static DEFAULT_TESTS: (typeof Links | typeof Scripts | typeof Images)[];
    static PROOFER_DEFAULTS: IOptions;
    static TYPHOEUS_DEFAULTS: {
        followlocation: boolean;
        headers: {
            'User-Agent': string;
            Accept: string;
        };
        connecttimeout: number;
        timeout: number;
    };
    static HYDRA_DEFAULTS: {
        max_concurrency: number;
    };
    static PARALLEL_DEFAULTS: {
        enable: boolean;
    };
    static CACHE_DEFAULTS: {};
    static generate_defaults(opts: IOptions | null): IOptions;
    static parse_json_option(option_name: string | null, config: string | null, symbolize_names?: boolean): any;
}
