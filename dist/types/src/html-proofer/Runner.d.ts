import { Failure } from './Failure.js';
import { ICache, ICheck, ICheckResult, IExtMetadata, IHtml, ILogger, IOptions, IReporter, IRunner, ISource } from "../interfaces";
export declare class Runner implements IRunner {
    current_source: string | null;
    current_filename: string | null;
    logger: ILogger;
    cache: ICache;
    options: IOptions;
    checked_paths: Map<string, boolean>;
    checked_hashes: Map<string, Map<string, boolean>>;
    private readonly type;
    private readonly sources;
    private failures;
    reporter: IReporter;
    private internal_urls;
    external_urls: Map<string, Array<IExtMetadata>>;
    private before_request;
    private _checks;
    constructor(sources: ISource, opts?: IOptions | null);
    run(): Promise<void>;
    check_list_of_links(): Promise<void>;
    check_files(): Promise<void>;
    get process_files(): ICheckResult[];
    load_file(path: string, source: string): ICheckResult;
    check_parsed(html: IHtml, p: string, source: string): ICheckResult;
    private validate_external_urls;
    private validate_internal_urls;
    get files(): {
        source: string;
        path: string;
    }[];
    ignore_file(file: string): boolean;
    check_sri(): boolean;
    enforce_https(): boolean;
    get checks(): Array<any>;
    get failed_checks(): Array<Failure>;
    report_failed_checks(): void;
    add_before_request(block: any): any[];
    load_internal_cache(): any;
    load_external_cache(): any;
    format_checks_list(checks: Array<ICheck>): string;
    private load_cache;
}
