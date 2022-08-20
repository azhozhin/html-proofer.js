import { Reporter } from '../Reporter';
import { ILogger } from "../../interfaces/ILogger";
export declare class Cli extends Reporter {
    constructor(logger: ILogger);
    report(): void;
}
