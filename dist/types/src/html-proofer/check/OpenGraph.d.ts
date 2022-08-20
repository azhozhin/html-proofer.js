import { Check } from '../Check';
import { Element } from "../Element";
export declare class OpenGraph extends Check {
    run(): Map<string, import("../../interfaces/IExtMetadata").IExtMetadata[]>;
    missing_content(element: Element): boolean;
    empty_content(element: Element): boolean;
}
