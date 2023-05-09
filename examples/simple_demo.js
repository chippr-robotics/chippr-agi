import { CHIPPRAGI }  from "../src/index.js";
import * as dotenv from 'dotenv';
    dotenv.config();

const OBJECTIVE = "Write the worlds greatest robot detective novel."

setTimeout(()=> {
    //_eventType, _entityID, _componentName, _sourceSystem, _data
    CHIPPRAGI.MessageBus.updateMessage( 'createEntity', '0000000000', 'ObjectiveDescription', {}, { 
        task : OBJECTIVE,
    });  
    CHIPPRAGI.Logger.info({ log : "Creating test objective", system: "Simple-Demo"});
},10000);
