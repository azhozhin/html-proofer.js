import { IReporter } from "../interfaces/IReporter";
import { ILogger } from "../interfaces/ILogger";
import { Failure } from "./Failure";
export declare class Reporter implements IReporter {
    failures: Array<Failure>;
    protected logger: ILogger;
    constructor(logger: ILogger);
    set_failures(failures: Array<Failure>): void;
    report(): void;
}
