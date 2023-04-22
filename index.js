import * as dotenv from 'dotenv';
dotenv.config();

import 'fs';
import 'vm';
import { CHIPPRAGI } from './core/ChipprAGI.js';
import ('./systems/active/CoreSystemLoader.mjs');


export const CHIPPRAGI = new CHIPPRAGI({
    //will try process.env then apply defaults
    //defaults will be applied if not found in process.env
    //defaults shopuld make the mvp system runable
    //core systems
    TESTING : process.env.CHIPPRAGI_TESTING || false,
    CORE:{
        SWARM_MODE: process.env.CHIPPRAGI_SWARM_MODE || true,
        MSG_BUS : process.env.CHIPPRAGI_MSG_BUS || 'local',
        WATCH : process.env.CHIPPRAGI_WATCH || false,
        DASHBOARD : process.env.CHIPPRAGI_DASHBOARD || false,
    },
    VECTORDB:{  
        VECTORDB_TYPE: process.env.CHIPPRAGI_VECTORDB_TYPE || 'local',
        VECTORDB_HOST: process.env.CHIPPRAGI_REDIS_HOST || 'redis://localhost',
        VECTORDB_PORT: process.env.CHIPPRAGI_REDIS_PORT || '6965',    
    },

    LANGUAGE_MODEL:{
        LANGUAGE_MODEL_API_KEY: process.env.CHIPPRAGI_LANGUAGE_MODEL_API_KEY || null,
        LANGUAGE_MODEL_API_URL: process.env.CHIPPRAGI_LANGUAGE_MODEL_API_URL || null,
        LANGUAGE_MODEL_MODEL_ID: process.env.CHIPPRAGI_LANGUAGE_MODEL_MODEL_ID || 'openai',
        LANGUAGE_MODEL_MODEL_NAME: process.env.CHIPPRAGI_LANGUAGE_MODEL_MODEL_NAME || 'text-davinvi-003',
        LANGUAGE_MODEL_DEFAULT_TEMP: process.env.CHIPPRAGI_LANGUAGE_MODEL_DEFAULT_TEMP || 0.5,
        LANGUAGE_MODEL_DEFAULT_MAX_TOKENS: process.env.CHIPPRAGI_LANGUAGE_MODEL_DEFAULT_MAX || 500,
        LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH: process.env.CHIPPRAGI_LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH || 5,
    },
    MESSAGE_BUS:{
        MESSAGE_BUS_TYPE: process.env.CHIPPRAGI_MESSAGE_BUS_TYPE || 'local',
    },
});

