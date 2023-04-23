import { CHIPPRAGI } from "../../../index.js";
import * as fs from 'fs';
import { createHash } from 'node:crypto';

CHIPPRAGI.registerSystem('GenerateTasksSystem', {
  info: {
    version : "",
    license : "",
    developer: "",
    description : "This system listens for new objectives and creates a list of tasks. It then creates entities for those tasks",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE',update(eventData));
    CHIPPRAGI.subscribe('REMOVE',update(eventData));
    CHIPPRAGI.subscribe('TICK',update(eventData));
    CHIPPRAGI.subscribe('SYSTEM', (eventData) => {
      if (eventData.eventType === 'newObjective') this.handleNewObjective(eventData.payload);
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
        let outbound = fs.readFileSync('./src/prompts/GenerateTasksPrompt.json','utf-8', (error, data) => {
          if (error) throw error;
          return data;
        }); 
        //2) get context
        //none needed yet for fresh tasks....
        //3) replace varaible with context
        //console.log(`event data: ${JSON.stringify(data)}`);
        let objectiveDescription = CHIPPRAGI.getComponentData(eventData.entityID, 'ObjectiveDescription');
        //console.log(`objetive: ${objectiveDescription}`);
        let prompt = [];
        JSON.parse(outbound).task_prompt.forEach( t => {
            prompt.push(t.replace('{{ objective }}', objectiveDescription.objective));
          },prompt);
        //console.log(`outbound prompt: ${prompt.join('\n')}`);
        
        //4) generate tasks
        //todo loop until a valid object is returned
        let success = false;
        //throw error;
        let newTasks = await this.generate(prompt.join('\n'));
        //console.log(newTasks);
        while (!success){
        //5) generate event to create for each tasks 
        //console.log(success);
          try {
            JSON.parse(newTasks).forEach( async task => {
              let taskID = this.getHashId(task.task);
              //create an entity
              //console.log(`making task ${task.task}`)
              CHIPPRAGI.createEntity(taskID);
              //add the description component
              CHIPPRAGI.addComponent( taskID, 'TaskDescription', {
               entityID : taskID,
               task : task.task,
               complete : false,
              });
              //add a parent component
              CHIPPRAGI.addComponent( taskID, 'TaskParent', {
               entityID : taskID,
               parentId : data.objectiveID,
              });
              //announce the task
            });
            success = true;
          } catch(error) {
          // the response was not json so we need to try again console.logging for trouble shoooting
          //console.log(newTasks);
          //console.log(error);
            newTasks = await this.generate(prompt.join('\n'));
        }         
      }
    },
    
    generate: async function (_prompt) {
        let response = await CHIPPRAGI.langModel.createCompletion({
            model: CHIPPRAGI.langModel.MODEL_NAME,
            prompt: _prompt,
            temperature: 0.5,
            max_tokens: 2000,
        });
        return response.data.choices[0].text;
    },
    
    getHashId: function (_taskDescription){
      //create a hash
      let hash =  createHash('sha256');
      hash.write(_taskDescription);
      hash.end();
      //use the first 10 bytes of the hash as the hashID
      let hashID = hash.read().toString('hex').slice(0,10)
      return hashID
    }
  });
  