import { CHIPPRAGI } from "../../index.js";
import { TaskExpanderPrompt } from '../../prompts/TaskExpanderPrompt.js'


CHIPPRAGI.registerSystem('TaskExpanderSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    type: 'system',
    description : "This system expands the details of the a task so that it is well explained",
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
           //CHIPPRAGI.Logger.error({system: 'TaskExpanderSystem.update', log: eventData});
          //make sure the system is selected
          if(eventData.payload.data == "TaskExpanderSystem") {
            this.handleExpandTask(eventData);
          }
        break;
        default:
      }
    },
  
    remove: function (eventData) {
      // Do something when the component or its entity is detached, if needed.
      // add logic to remove an entity arrivesent arrives
    },
    
    handleExpandTask : async function (eventData) {
        //3) replace varaible with context
        let entityDescription = await CHIPPRAGI.getComponentData(eventData.payload.entityID, 'TaskDescription');
        //CHIPPRAGI.Logger.error({system: 'TaskExpanderSystem.entityDescription', log: null , task: entityDescription} );
        let prompt = [];
        (TaskExpanderPrompt.task_prompt).forEach( t => {
           // console.log(objectiveDescription.objective);
            prompt.push(t.replace('{{ taskDescription }}', entityDescription.objective || entityDescription.task));
          },prompt);
          //CHIPPRAGI.Logger.error({system: 'TaskExpanderSystem.prompt', log: null , task: prompt} );
        //4) generate tasks
        //todo loop until a valid object is returned
        let success = false;
        //throw error;
        let expandedTask;
        //CHIPPRAGI.Logger.error({system: 'TaskExpanderSystem.expandedTask', log: null , task: expandedTask} );
        while (!success){
        //5) generate event to create for each tasks 
          try {
            expandedTask = await CHIPPRAGI.LangModel.generate(prompt.join('\n'));
            //console.error(expandedTask)
            //CHIPPRAGI.Logger.error({system: 'TaskExpanderSystem.newTask', log: null, task: expandedTask.join('\n')} );
            expandedTask.forEach( async task => {
              console.log(task);
              let newTask = { ...task};
              newTask.expandedTask = expandedTask.taskDetails;
              newTask.justification = expandedTask.justification;
              //CHIPPRAGI.Logger.error({system: 'TaskExpanderSystem.newTask', log: null, task: newTask} );
              await CHIPPRAGI.addComponent( data.payload.entityID, 'TaskExpanded', newTask ); 
              //send it to the judge
              //CHIPPRAGI.MessageBus.updateMessage('taskCompleted', data.payload.entityID, 'TaskExpanded', this.info, newTask);
            });
            success = true;
          } catch(error) {
          // the response was not json so we need to try again console.logging for trouble shoooting
          CHIPPRAGI.Logger.error({system: 'TaskExpanderSystem.error', log: JSON.stringify(expandedTask), error: error});
          
        }
      }
    },
});
  