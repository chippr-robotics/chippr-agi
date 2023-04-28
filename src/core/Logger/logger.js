import * as winston from 'winston';
import path from 'path';

export class Logger {
    constructor(chipprConfig) {
      this.logger =  this.createLogger(chipprConfig.LOG.LOG_LEVEL);
    }
    createLogger(level) {
        winston.createLogger({
            format: winston.format.json(),
            transports: [
                new (winston.transports.Console)({
                    level:chipprConfig.LOG.LOG_LEVEL
                }),
                new (winston.transports.File)({
                    name: 'info-file',
                    filename: path.resolve(__dirname, '../logs/info.log'),
                    level: 'info'
                }),
                new (winston.transports.File)({
                    name: 'error-file',
                    filename: path.resolve(__dirname, '../logs/error.log'),
                    level: 'error'
                }),
            ]
        });
    }
}        