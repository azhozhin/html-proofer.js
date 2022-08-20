"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLProofer = void 0;
const fs_1 = __importDefault(require("fs"));
const Runner_1 = require("./html-proofer/Runner");
const CheckType_1 = require("./html-proofer/CheckType");
const interfaces_1 = require("./interfaces/");
class HTMLProofer {
    static check_file(file, opts) {
        if (file.constructor.name !== 'String') {
            throw new Error('ArgumentError');
        }
        if (!fs_1.default.existsSync(file)) {
            throw new Error(`ArgumentError: ${file} does not exist`);
        }
        let options = (opts || interfaces_1.EmptyOptions);
        options.type = CheckType_1.CheckType.FILE;
        return new Runner_1.Runner(file, options);
    }
    static check_directory(directory, opts) {
        if (!fs_1.default.existsSync(directory)) {
            throw new Error(`ArgumentError: ${directory} does not exist`);
        }
        let options = (opts || interfaces_1.EmptyOptions);
        options.type = CheckType_1.CheckType.DIRECTORY;
        return new Runner_1.Runner([directory], options);
    }
    static check_directories(directories, opts) {
        if (!Array.isArray(directories)) {
            throw new Error('ArgumentError');
        }
        let options = (opts || interfaces_1.EmptyOptions);
        options.type = CheckType_1.CheckType.DIRECTORIES;
        for (const directory of directories) {
            if (!fs_1.default.existsSync(directory)) {
                throw new Error(`ArgumentError: ${directory} does not exist`);
            }
        }
        return new Runner_1.Runner(directories, options);
    }
    static check_links(links, opts) {
        if (!Array.isArray(links)) {
            throw new Error('ArgumentError');
        }
        let options = (opts || interfaces_1.EmptyOptions);
        options.type = CheckType_1.CheckType.LINKS;
        return new Runner_1.Runner(links, options);
    }
}
exports.HTMLProofer = HTMLProofer;
