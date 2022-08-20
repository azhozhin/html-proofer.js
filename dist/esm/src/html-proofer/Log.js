// import winston from 'winston'
// import {format} from 'logform'
import log4js from 'log4js';
export class Log {
    constructor() {
        const inst = log4js.configure({
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
