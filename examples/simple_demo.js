import { CHIPPRAGI }  from "../src/index.js";
import * as dotenv from 'dotenv';
    dotenv.config();


setTimeout(()=> {
    //_eventType, _entityID, _componentName, _sourceSystem, _data
    CHIPPRAGI.MessageBus.updateMessage( 'createEntity', '0000000000', 'ObjectiveDescription', {}, { 
        task : "Write the worlds greates robot detective novel",
    });  
    CHIPPRAGI.Logger.info({ SimpleDemo : "Creating test objective"});
},10000);
