import { Check } from '../Check';
import { Element } from "../Element";
import { ICheckResult } from "../../interfaces";
export declare class Scripts extends Check {
    run(): ICheckResult;
    missing_src(script: Element): boolean;
    check_sri(script: Element): void;
}
