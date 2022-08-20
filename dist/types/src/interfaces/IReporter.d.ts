import { Failure } from "../html-proofer/Failure";
export interface IReporter {
    report(): void;
    set_failures(failures: Array<Failure>): void;
    failures: Array<Failure>;
}
