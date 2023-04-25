import { CHIPPRAGI }  from "../src/index.js";
import * as dotenv from 'dotenv';
    dotenv.config();


setTimeout(()=> {
    //_eventType, _entityID, _componentName, _sourceSystem, _data
    CHIPPRAGI.MessageBus.systemMessage( 'createObjective', '0000000000', 'ObjectiveDescription', {}, { 
        objectiveDescription : "This is a test objective"
    });  
    console.log('Creating test objective');
},10000);
