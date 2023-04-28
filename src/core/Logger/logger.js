import * as winston from 'winston';

export function Logger(chipprConfig){
        let consoleLogger;
        let debugLogger;
        let transports = [];
        let dir = '../logs/';
        //log to console if enabled
        if(chipprConfig.LOGS.LOG_CONSOLE == true) {
            consoleLogger = new (winston.transports.Console)({
                level: 'info'
            });
            transports.push(consoleLogger);
        }; 
        
        if(chipprConfig.LOGS.DEBUG == true) {
            debugLogger = new (winston.transports.File)({
                name: 'debug-logs',
                filename: dir + 'debug.log',
                level: 'debug'
            });
            transports.push(debugLogger);
        }; 
        
        transports.push(new (winston.transports.File)({
            name: 'info-logs',
            filename: dir + 'info.log',
            level: 'info'
            })
        );

        transports.push(new (winston.transports.File)({
            name: 'error-logs',
            filename: dir + 'errors.log',
            level: 'error'
            }),
        );
        return winston.createLogger({
            format: winston.format.json(),
            transports: transports
        });
    }       