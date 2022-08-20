import { UrlValidator } from '../UrlValidator';
import { Url } from '../attribute/Url';
import { IRunner, IIntMetadata } from "../../interfaces/";
export declare class Internal extends UrlValidator {
    private readonly internal_urls;
    constructor(runner: IRunner, internal_urls: Map<string, Array<IIntMetadata>>);
    validate(): Promise<any[]>;
    run_internal_link_checker(links: Map<string, Array<IIntMetadata>>): any[];
    file_exists(url: Url): boolean;
    hash_exists(url: Url): boolean;
    find_fragments(fragment_ids: Array<string>, url: Url): Array<any>;
}
