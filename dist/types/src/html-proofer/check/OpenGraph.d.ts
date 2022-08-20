import { Check } from '../Check';
import { Element } from "../Element";
import { ICheckResult } from "../../interfaces";
export declare class OpenGraph extends Check {
    run(): ICheckResult;
    missing_content(element: Element): boolean;
    empty_content(element: Element): boolean;
}
