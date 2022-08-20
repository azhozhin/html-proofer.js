import { IHtml } from "./IHtml";
import { IRunner } from "./IRunner";
import { Failure } from "../html-proofer/Failure";
import { IMetadata } from "./IMetadata";
import { IExtMetadata } from "./IExtMetadata";
export interface ICheckConstructor {
    new (runner: IRunner, html: IHtml): ICheck;
}
export interface ICheck {
    name: string;
    run(): void;
    failures: Array<Failure>;
    internal_urls: Map<string, Array<IMetadata>>;
    external_urls: Map<string, Array<IExtMetadata>>;
}
export declare function createCheck(ctor: ICheckConstructor, runner: IRunner, html: IHtml): ICheck;
