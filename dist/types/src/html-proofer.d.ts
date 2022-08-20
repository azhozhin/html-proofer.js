import { Runner } from './html-proofer/Runner';
import { IOptions } from "./interfaces/IOptions";
export declare class HTMLProofer {
    static check_file(file: string, opts?: IOptions): Runner;
    static check_directory(directory: string, opts?: IOptions): Runner;
    static check_directories(directories: Array<string>, opts?: IOptions): Runner;
    static check_links(links: Array<string>, opts?: IOptions): Runner;
}
