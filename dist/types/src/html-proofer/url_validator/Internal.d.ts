import { UrlValidator } from '../UrlValidator';
import { Url } from '../attribute/Url';
import { IRunner } from "../../interfaces/IRunner";
import { IMetadata } from "../../interfaces/IMetadata";
export declare class Internal extends UrlValidator {
    private readonly internal_urls;
    constructor(runner: IRunner, internal_urls: Map<string, Array<IMetadata>>);
    validate(): Promise<any[]>;
    run_internal_link_checker(links: Map<string, Array<IMetadata>>): any[];
    file_exists(url: Url): boolean;
    hash_exists(url: Url): boolean;
    find_fragments(fragment_ids: Array<string>, url: Url): Array<any>;
}
