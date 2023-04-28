import * as winston from 'winston';

export function Logger(chipprConfig){
        let consoleLogger;
        let debugLogger;
        //log to console if enabled
        if(chipprConfig.LOGS.LOG_CONSOLE) {
            consoleLogger = new (winston.transports.Console)({
                level: chipprConfig.LOGS.LOG_LEVEL
            });
        }; 
        if(chipprConfig.LOGS.DEBUG) {
            debugLogger = new (winston.transports.File)({
                name: 'debug-logs',
                filename: '../logs/debug.log',
                level: 'debug'
            });
        }; 
        return winston.createLogger({
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