import { IOptions } from "../interfaces/IOptions";
import { IRunner } from "../interfaces/IRunner";
export declare class Cache implements ICache {
    private readonly runner;
    private readonly logger;
    private readonly options;
    constructor(runner: IRunner, opts?: IOptions);
    add_internal(url: any, metadata: any, found: any): void;
    add_external(url: any, filenames: any, status_code: any, msg: any): void;
    write(): void;
    enabled(): boolean;
}
