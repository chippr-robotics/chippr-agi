import * as winston from 'winston';
import path from 'path';

export class Logger {
    constructor(chipprConfig) {
      this.logger =  this.createLogger(chipprConfig.LOG.LOG_LEVEL);
    }
    createLogger(config) {
        let consoleLogger;
        let debugLogger;
        //log to console if enabled
        if(config.LOG.LOG_CONSOLE) {
            consoleLogger = new (winston.transports.Console)({
                level: config.LOG.LOG_LEVEL
            });
        } else {
            consoleLogger = null;
        }
        if(config.LOG.DEBUG) {
            debugLogger = new (winston.transports.File)({
                name: 'debug-logs',
                filename: path.resolve(__dirname, '../logs/debug.log'),
                level: 'debug'
            });
        } else {
            debugLogger = null;
        }
        winston.createLogger({
            format: winston.format.json(),
            transports: [
                consoleLogger,
                debugLogger,
                new (winston.transports.File)({
                    name: 'info-logs',
                    filename: path.resolve(__dirname, '../logs/info.log'),
                    level: 'info'
                }),
                new (winston.transports.File)({
                    name: 'error-logs',
                    filename: path.resolve(__dirname, '../logs/errors.log'),
                    level: 'error'
                }),
            ]
        });
    }
}        