import { ILogger } from "../interfaces/ILogger";
import { IExternalRequest } from "../interfaces/IExternalRequest";
export declare class Hydra {
    private logger;
    private requests;
    private requestVerboseInterceptor;
    private responseVerboseInterceptor;
    constructor(logger: ILogger);
    injectVerboseInterceptors(): void;
    ejectVerboseInterceptors(): void;
    run(): Promise<void>;
    queue(request: IExternalRequest): void;
}
