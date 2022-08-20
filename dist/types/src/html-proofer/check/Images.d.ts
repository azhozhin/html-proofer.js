import { Check } from '../Check';
import { Element } from "../Element";
export declare class Images extends Check {
    SCREEN_SHOT_REGEX: RegExp;
    run(): void;
    ignore_missing_alt(): boolean;
    ignore_empty_alt(): boolean;
    ignore_element(img: Element): boolean;
    missing_alt_tag(img: Element): boolean;
    empty_alt_tag(img: Element): boolean;
    alt_all_spaces(img: Element): boolean;
    terrible_filename(img: Element): boolean;
    missing_src(img: Element): boolean;
}
