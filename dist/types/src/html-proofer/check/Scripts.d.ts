import { Check } from '../Check';
import { Element } from "../Element";
export declare class Scripts extends Check {
    run(): Map<string, import("../../interfaces/IExtMetadata").IExtMetadata[]>;
    missing_src(script: Element): boolean;
    check_sri(script: Element): void;
}
