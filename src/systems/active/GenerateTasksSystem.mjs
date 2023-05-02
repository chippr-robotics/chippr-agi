import { CHIPPRAGI } from "../../index.js";
import { GenerateTasksPrompt } from '../../prompts/GenerateTasksPrompt.js'


CHIPPRAGI.registerSystem('GenerateTasksSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    type: 'system',
    description : "This system listens for new objectives and creates a list of tasks. It then creates entities for those tasks",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE', (eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('UPDATE', (message) => {this.update(message)});
  },
  
    update: function (message) {
      // Do something when the component's data is updated, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the updated data for the component.
      let eventData = JSON.parse(message);
      switch(eventData.eventType){
        case  'systemSelected' : 
          this.handleNewObjective(eventData);
        break;
        default:
      }
    },
  
    remove: function (eventData) {
      // Do something when the component or its entity is detached, if needed.
      // add logic to remove an entity arrivesent arrives
    },
    
    handleNewObjective : async function (eventData) {
        //3) replace varaible with context
        let entityDescription = await CHIPPRAGI.getComponentData(eventData.payload.entityID, eventData.payload.componentName);
        
        let prompt = [];
        (GenerateTasksPrompt.task_prompt).forEach( t => {
           // console.log(objectiveDescription.objective);
            prompt.push(t.replace('{{ objective }}', entityDescription.objective || entityDescription.task));
          },prompt);
        
        //4) generate tasks
        //todo loop until a valid object is returned
        let success = false;
        //throw error;
        let newTasks = await CHIPPRAGI.LangModel.generate(prompt.join('\n'));
        
        while (!success){
        //5) generate event to create for each tasks 
        
          try {
            JSON.parse(newTasks).forEach( task => {
              let newTask = { ...task};
              newTask.parentID = eventData.payload.entityID;
              CHIPPRAGI.MessageBus.updateMessage('createEntity', newTask.taskID, 'TaskDescription', this.info, newTask);
            });
            success = true;
          } catch(error) {
          // the response was not json so we need to try again console.logging for trouble shoooting
            CHIPPRAGI.Logger.error({system: 'GenerateTasksSystem', log: newTasks, error: JSON.stringify(error)});
            newTasks = await CHIPPRAGI.LangModel.generate(prompt.join('\n'));
        }
          //

      }
    },
});
  