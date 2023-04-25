import { CHIPPRAGI } from "../../index.js";
import { GenerateTasksPrompt } from '../../prompts/GenerateTasksPrompt.js'


CHIPPRAGI.registerSystem('GenerateTasksSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This system listens for new objectives and creates a list of tasks. It then creates entities for those tasks",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE', (type, eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('UPDATE', (message) => {this.update(message)});
  },
  
    update: function (eventData) {
      // Do something when the component's data is updated, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the updated data for the component.
      let eventData = JSON.parse(message);
      switch(eventData.eventType){
        case  'generateTasks' : 
          this.handleNewObjective(eventData);
        break;
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
        //1) get prompt for generate task
        //console.log('creating tasks');
        //console.log(fs.readdirSync('./src/prompts'));
        //2) get context
        //none needed yet for fresh tasks....
        //3) replace varaible with context
        //console.log(`event data: ${JSON.stringify(data)}`);
        //console.log(`outbound: ${JSON.stringify(eventData)}`);
        let entityDescription = await CHIPPRAGI.getComponentData(eventData.payload.entityID, eventData.payload.componentName);
        //console.log(`outbound: ${objectiveDescription}`);
        
        let prompt = [];
        //console.log(`prompt: ${GenerateTasksPrompt.task_prompt}`);
        (GenerateTasksPrompt.task_prompt).forEach( t => {
           // console.log(objectiveDescription.objective);
            prompt.push(t.replace('{{ objective }}', entityDescription.objective || entityDescription.task));
          },prompt);
        //console.log(`outbound prompt: ${prompt.join('\n')}`);
        
        //4) generate tasks
        //todo loop until a valid object is returned
        let success = false;
        //throw error;
        let newTasks = await CHIPPRAGI.LangModel.generate(prompt.join('\n'));
        //console.log(newTasks);
        //console.log(`new tasks returned: ${newTasks}`)
     
        while (!success){
        //5) generate event to create for each tasks 
        //console.log(success);
          try {
            JSON.parse(newTasks).forEach( task => {
              let newTask = { ...task};
              newTask.parentID = eventData.payload.entityID;
              CHIPPRAGI.MessageBus.updateMessage('createEntity', newTask.taskID, eventData.payload.componentName, this.info, newTask);
            });
            success = true;
          } catch(error) {
          // the response was not json so we need to try again console.logging for trouble shoooting
          //console.log(newTasks);
          //console.log(error);
            newTasks = await CHIPPRAGI.LangModel.generate(prompt.join('\n'));
        }
          //

      }
    },
});
  