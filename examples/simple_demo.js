import { CHIPPRAGI }  from "../index.js";
CHIPPRAGI.subscribe('SYSTEM', (message, data) => {});//console.log(`simple demo message:${message}, data:${JSON.stringify(data[0])}`)});
setTimeout(()=> {
    let newMessage = { ...CHIPPRAGI.MessageBus.MessageSchema };
    newMessage.eventType = 'createObjective';
    newMessage.payload.componentName = 'ObjectiveDescription';
    newMessage.payload.data = { 
        objectiveDescription : "This is a test objective"
    };
    newMessage.metadata.sourceSystem = 'userEntry';
    //console.log(newMessage);
    CHIPPRAGI.publish('SYSTEM', [newMessage]);
  
    //console.log('Creating test objective');
},10000);
