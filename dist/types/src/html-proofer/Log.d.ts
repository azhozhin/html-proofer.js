import log4js from 'log4js';
import { ILogger } from "../interfaces";
export declare class Log implements ILogger {
    logger: log4js.Logger;
    err_logger: log4js.Logger;
    constructor();
    log(level: string, message: string): void;
}
