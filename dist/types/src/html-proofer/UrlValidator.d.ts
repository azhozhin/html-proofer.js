import { IRunner, ILogger, ICache } from "../interfaces";
export declare class UrlValidator {
    protected runner: IRunner;
    protected cache: ICache;
    protected logger: ILogger;
    protected failed_checks: any[];
    constructor(runner: IRunner);
}
