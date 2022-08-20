export declare class Failure {
    path: string;
    check_name: string;
    description: string;
    line: number | null;
    status: string | null;
    content: string | null;
    constructor(path: string, check_name: string, description: string, line?: (number | null), status?: (string | null), content?: (string | null));
}
