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
    CHIPPRAGI.subscribe('SYSTEM', (type, eventData) => {
      if (eventData[0].eventType === 'newObjective') {
        //console.log(`generate task system found new objective ${JSON.stringify(eventData)}`);
        this.handleNewObjective(eventData[0]);
      }
      });
  },
  
    update: function (eventData) {
      // Do something when the component's data is updated, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the updated data for the component.
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
        let objectiveDescription = await CHIPPRAGI.getComponentData(eventData.payload.entityID, 'ObjectiveDescription');
        //console.log(`outbound: ${objectiveDescription}`);
        
        let prompt = [];
        //console.log(`prompt: ${GenerateTasksPrompt.task_prompt}`);
        (GenerateTasksPrompt.task_prompt).forEach( t => {
           // console.log(objectiveDescription.objective);
            prompt.push(t.replace('{{ objective }}', objectiveDescription.objective));
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
              //console.log(`raw task: ${JSON.stringify(newTask)}`);
              newTask.taskID = CHIPPRAGI.Util.getHashId(task.task);
              console.log(`updated task: ${JSON.stringify(newTask)}`);              
              //console.log( `in the task loop parsing task:${JSON.stringify(taskID)}`);
              //create an entity
              CHIPPRAGI.createEntity(newTask.taskID);
              CHIPPRAGI.MessageBus.systemMessage('newEntity', newTask.taskID, null, this.info, newTask.task);
              //add the description component
              CHIPPRAGI.addComponent( newTask.taskID, 'TaskDescription', {
               task : newTask.task,
               complete : false,
              });
              CHIPPRAGI.MessageBus.updateMessage('addTaskDescription', newTask.taskID, 'TaskDescription', this.info, newTask.task);
              //add a parent component
              CHIPPRAGI.addComponent( newTask.taskID, 'TaskParent', {
               parentId : eventData.payload.entityID,
              });
              CHIPPRAGI.MessageBus.updateMessage('addTaskParent', newTask.taskID, 'TaskParent', this.info, newTask.task);
              //announce the task
              //_eventType, _entityID, _componentName, _sourceSystem, _data
              //console.log( `sending message with taskID: ${taskID}`);
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
  