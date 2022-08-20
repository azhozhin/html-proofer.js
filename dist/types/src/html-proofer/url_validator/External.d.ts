import { UrlValidator } from '../UrlValidator';
import { Url } from '../attribute/Url';
import { IRunner } from "../../interfaces/IRunner";
import { IExtMetadata } from "../../interfaces/IExtMetadata";
export declare class External extends UrlValidator {
    before_request: any[];
    private readonly external_urls;
    private hydra;
    private paths_with_queries;
    constructor(runner: IRunner, external_urls: Map<string, any>);
    validate(): Promise<any[]>;
    run_external_link_checker(links: Map<string, Array<IExtMetadata>>): Promise<void>;
    queue_request(method: string, url: Url, filenames: Array<IExtMetadata>): void;
    failure_handler(error: any, url: Url, filenames: Array<IExtMetadata>): void;
    response_handler(response: any, url: Url, filenames: Array<IExtMetadata>): void;
    handle_timeout(href: string | null, filenames: Array<IExtMetadata>, response_code: string): void;
    check_hash_in_2xx_response(href: string | null, url: Url, response: any, filenames: Array<IExtMetadata>): boolean | undefined;
    handle_connection_failure(href: string | null, metadata: Array<IExtMetadata>, response_code: string, status_message: string): void;
    add_failure(metadata: Array<IExtMetadata>, description: string, status?: string | null): void;
    new_url_query_values(url: Url): boolean;
}
