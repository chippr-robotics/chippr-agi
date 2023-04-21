import { CHIPPRAGI } from "../index.js";
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { createHash } from 'node:crypto';

CHIPPRAGI.registerSystem('GenerateTasksSystem', {
  info: {
    version : "",
    license : "",
    developer: "",
    description : "",
  },

  init: function () {
    CHIPPRAGI.on('newObjective', (data) => {
      this.handleNewObjective(data);
    });
  },
  
    update: function (entityId, componentData) {
      // Do something when the component's data is updated, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the updated data for the component.
    },
  
    remove: function () {
      // Do something when the component or its entity is detached, if needed.
      this.CHIPPRAGI.eventBus.off('newObjective', this.handleNewObjective);
    },
    
    handleNewObjective : async function (data) {
        //1) get prompt for generate task
        console.log('creating tasks')
        let GenerateTasksPrompt = yaml.load(fs.readFileSync('./prompts/GenerateTasksPrompt.yml', 'utf8')); 
        //2) get context
        //none needed for fresh tasks....
        //3) replace varaible with context
        let prompt = GenerateTasksPrompt.task_prompt.replace('{{ objective }}', data.objectiveDescription);
        //4) generate tasks
        //todo loop until a valid object is returned
        let success = false;
        let newTasks = await this.generate(prompt);
        console.log(newTasks);
        while (!success){
        //5) generate event to create for each tasks 
        //console.log(success);
        try {
          JSON.parse(newTasks).forEach( async task => {
            let taskID = this.getHashId(task.task);
            //create an entity
            CHIPPRAGI.createEntity(taskID);
            //add the description component
            CHIPPRAGI.addComponent( taskID, 'TaskDescription', {
              entityID : taskID,
              task : task.task,
              complete : false,
              dependencies : [],
            });
            //add a parent component
            CHIPPRAGI.addComponent( taskID, 'TaskParent', {
              entityID : taskID,
              parentId : data.objectiveID,
            });
            //announce the task
            CHIPPRAGI.emit('newEntity', { entityID : taskID });  
          });
          success = true;
        } catch(error) {
          // the response was not json so we need to try again console.logging for trouble shoooting
          //console.log(newTasks);
          //console.log(error);
          newTasks = await this.generate(prompt);
        }         
      }
    },
    
    generate: async function (_prompt) {
        let response = await CHIPPRAGI.langModel.createCompletion({
            model: process.env.MODEL,
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
  