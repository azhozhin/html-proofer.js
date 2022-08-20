import { Failure } from './Failure';
import { Element } from './Element';
import { IRunner } from "../interfaces/IRunner";
import { IMetadata } from "../interfaces/IMetadata";
import { IHtml } from "../interfaces/IHtml";
import { Url } from "./attribute/Url";
import { ICheck } from "../interfaces/ICheck";
import { IExtMetadata } from "../interfaces/IExtMetadata";
export declare class Check implements ICheck {
    html: IHtml;
    failures: Array<Failure>;
    internal_urls: Map<string, Array<IMetadata>>;
    external_urls: Map<string, Array<IExtMetadata>>;
    protected runner: IRunner;
    private _base_url;
    constructor(runner: IRunner, html: IHtml);
    create_element(node: any): Element;
    run(): void;
    add_failure(description: string, line?: (number | null), status?: (string | null), content?: (string | null)): void;
    removeIgnoredTags(html: IHtml): IHtml;
    get short_name(): string;
    get name(): string;
    static getClassName(): string;
    add_to_internal_urls(url: Url, line: number | null): void;
    add_to_external_urls(url: Url, line: number | null): void;
    base_url(): string | null;
}
