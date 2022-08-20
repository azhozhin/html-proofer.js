interface ICache {
    add_internal(url: any, metadata: any, found: any): void;
    add_external(url: any, filenames: any, status_code: any, msg: any): void;
    write(): void;
    enabled(): boolean;
}
