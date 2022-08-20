import { Failure } from './Failure';
import { Element } from './Element';
import { Url } from "./attribute/Url";
import { ICheck, ICheckResult, IExtMetadata, IHtml, IIntMetadata, IRunner } from "../interfaces";
export declare abstract class Check implements ICheck {
    html: IHtml;
    failures: Array<Failure>;
    internal_urls: Map<string, Array<IIntMetadata>>;
    external_urls: Map<string, Array<IExtMetadata>>;
    protected runner: IRunner;
    private _base_url;
    constructor(runner: IRunner, html: IHtml);
    protected create_element(node: any): Element;
    abstract run(): ICheckResult;
    protected add_failure(description: string, line?: (number | null), status?: (string | null), content?: (string | null)): void;
    private removeIgnoredTags;
    get name(): string;
    protected add_to_internal_urls(url: Url, line: number | null): void;
    protected add_to_external_urls(url: Url, line: number | null): void;
    base_url(): string | null;
}
