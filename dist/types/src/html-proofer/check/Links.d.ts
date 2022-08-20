import { Check } from '../Check';
import { ICheck } from "../../interfaces/ICheck";
import { Element } from "../Element";
export declare class Links extends Check implements ICheck {
    EMAIL_REGEXP: RegExp;
    run(): void;
    allow_missing_href(): boolean | undefined;
    allow_hash_href(): boolean | undefined;
    check_schemes(link: Element): void;
    handle_mailto(link: Element): void;
    handle_tel(link: Element): void;
    ignore_empty_mailto(): boolean | undefined;
    SRI_REL_TYPES: string[];
    check_sri(link: Element): void;
    source_tag(link: Element): boolean;
    anchor_tag(link: Element): boolean;
}
