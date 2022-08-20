import { IRunner } from "../interfaces/IRunner";
export declare class Attribute {
    protected runner: IRunner;
    raw_attribute: string | null;
    constructor(runner: IRunner, raw_attribute: string | null);
}
