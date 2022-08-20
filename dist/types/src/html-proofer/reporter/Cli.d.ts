import { Reporter } from '../Reporter';
import { ILogger } from '../../interfaces';
export declare class Cli extends Reporter {
    constructor(logger: ILogger);
    report(): void;
}
