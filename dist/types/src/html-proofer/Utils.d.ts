import { IHtml } from "../interfaces";
export declare function isFile(filepath: string): boolean;
export declare function isDirectory(filepath: string): boolean;
export declare function pluralize(count: number, single: string, plural: string): string;
export declare function createDocument(src: string): IHtml;
export declare function isNullOrEmpty(str: string | null): boolean;
export declare function mergeConcat(a: Map<string, Array<any>>, b: Map<string, Array<any>>): void;
export declare function joinUrl(baseUrl: string, url: string): string;
export declare function hasUnicode(str: string): boolean;
/**
 * @description
 * Takes an Array<V>, and a grouping function,
 * and returns a Map of the array grouped by the grouping function.
 *
 * @param list An array of type V.
 * @param keyGetter A Function that takes the the Array type V as an input, and returns a value of type K.
 *                  K is generally intended to be a property key of V.
 *
 * @returns Map of the array grouped by the grouping function.
 */
export declare function groupBy<K, V>(list: Array<V>, keyGetter: (input: V) => K): Map<K, Array<V>>;
export declare function last(arr: Array<any>): any;
export declare function first(arr: Array<any>): any;
export declare function unique(arr: Array<string>): Array<string>;
