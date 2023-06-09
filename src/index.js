import { ChipprAGI } from './core/ChipprAGI.js';
import {  displayBootScreen, getPackageVersion } from './core/Util/BootScreen.mjs';

const config = {
    //will try process.env then apply defaults
    //defaults will be applied if not found in process.env
    //defaults shopuld make the mvp system runable
    //core systems
    TESTING : process.env.CHIPPRAGI_TESTING || false,
    CORE:{
        SWARM_MODE: process.env.CHIPPRAGI_SWARM_MODE || true,
        DASHBOARD : process.env.CHIPPRAGI_DASHBOARD || false,
        QUIET_BOOT : process.env.CHIPPAGI_CORE_QUIET_BOOT || false,
    },
    LOGS:{
        LOG_CONSOLE: process.env.CHIPPRAGI_LOG_CONSOLE || true,
        DEBUG: process.env.CHIPPRAGI_LOG_DEBUG || false,
    },
    LANGUAGE_MODEL:{
        LANGUAGE_MODEL_API_KEY: process.env.CHIPPRAGI_LANGUAGE_MODEL_API_KEY || null,
        LANGUAGE_MODEL_API_URL: process.env.CHIPPRAGI_LANGUAGE_MODEL_API_URL || null,
        LANGUAGE_MODEL_ID: process.env.CHIPPRAGI_LANGUAGE_MODEL_ID || 'openai',
        LANGUAGE_MODEL_GENERATE_NAME: process.env.CHIPPRAGI_LANGUAGE_MODEL_GENERATE_NAME || 'text-davinci-003',
        LANGUAGE_MODEL_DEFAULT_TEMP: process.env.CHIPPRAGI_LANGUAGE_MODEL_DEFAULT_TEMP || 0.5,
        LANGUAGE_MODEL_DEFAULT_MAX_TOKENS: process.env.CHIPPRAGI_LANGUAGE_MODEL_DEFAULT_MAX || 500,
        LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH: process.env.CHIPPRAGI_LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH || 5,
        LANGUAGE_MODEL_RATE_LIMIT_TYPE: process.env.CHIPPRAGI_LANGUAGE_MODEL_RATE_LIMIT_TYPE || 'openAI_Free',
    },
    MESSAGE_BUS:{
        MESSAGE_BUS_TYPE: process.env.CHIPPRAGI_MESSAGE_BUS_TYPE || 'redis',
        MESSAGE_BUS_WATCH : process.env.CHIPPRAGI_MESSAGE_BUS_WATCH || true,
    },
    VECTORDB:{  
        VECTORDB_TYPE: process.env.CHIPPRAGI_VECTORDB_TYPE || 'redis',
        VECTORDB_HOST: process.env.CHIPPRAGI_VECTORDB_HOST || 'localhost',
        VECTORDB_PORT: process.env.CHIPPRAGI_VECTORDB_PORT || '6379',    
    },
};

const version = await getPackageVersion();

displayBootScreen(version, config);
    
export const CHIPPRAGI = new ChipprAGI(config);
