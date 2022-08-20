"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
// import winston from 'winston'
// import {format} from 'logform'
const log4js_1 = __importDefault(require("log4js"));
class Log {
    constructor() {
        const inst = log4js_1.default.configure({
            appenders: {
                stderr: { type: 'stderr', layout: { type: 'messagePassThrough' }, level: 'error' },
                stdout: { type: 'stdout', layout: { type: 'messagePassThrough' }, level: 'info' },
            },
            categories: {
                default: { appenders: ['stdout'], level: 'info' },
                err: { appenders: ['stderr'], level: 'error' },
            },
        });
        this.logger = inst.getLogger();
        // we want only error level to be published into stderr, this is really weird that I need two loggers to archive it
        this.err_logger = inst.getLogger('err');
    }
    log(level, message) {
        if (level === 'error') {
            this.err_logger.log(level, message);
        }
        else {
            this.logger.log(level, message);
        }
    }
}
exports.Log = Log;
