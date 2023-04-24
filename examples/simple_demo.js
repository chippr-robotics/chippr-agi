import { CHIPPRAGI }  from "../index.js";

setTimeout(()=> {
    let newMessage = { ...CHIPPRAGI.MessageBus.MessageSchema };
    newMessage.eventType = 'createObjective';
    newMessage.payload.component = 'ObjectiveDescription';
    newMessage.payload.data = { 
        objectiveDescription : "This is a test objective"
    };
    newMessage.metadata.sourceSystem = 'userEntry';
    CHIPPRAGI.publish('SYSTEM', [newMessage]);
  
    console.log('Creating test objective');
},10000);
