import { IReporter } from "../interfaces";
import { ILogger } from "../interfaces";
import { Failure } from "./Failure";
export declare class Reporter implements IReporter {
    failures: Array<Failure>;
    protected logger: ILogger;
    constructor(logger: ILogger);
    set_failures(failures: Array<Failure>): void;
    report(): void;
}
