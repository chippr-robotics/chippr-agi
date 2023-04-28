import * as winston from 'winston';
import path from 'path';

export class Logger {
    constructor(chipprConfig) {
      this.logger =  this.createLogger(chipprConfig);
    }
    createLogger(config) {
        let consoleLogger;
        let debugLogger;
        //log to console if enabled
        if(config.LOGS.LOG_CONSOLE) {
            consoleLogger = new (winston.transports.Console)({
                level: config.LOGS.LOG_LEVEL
            });
        }; 
        if(config.LOGS.DEBUG) {
            debugLogger = new (winston.transports.File)({
                name: 'debug-logs',
                filename: '../logs/debug.log',
                level: 'debug'
            });
        }; 
        winston.createLogger({
            format: winston.format.json(),
            transports: [
                consoleLogger,
                debugLogger,
                new (winston.transports.File)({
                    name: 'info-logs',
                    filename: '../logs/info.log',
                    level: 'info'
                }),
                new (winston.transports.File)({
                    name: 'error-logs',
                    filename: '../logs/errors.log',
                    level: 'error'
                }),
            ]
        });
    }
}        