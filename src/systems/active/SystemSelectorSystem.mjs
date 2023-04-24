import { CHIPPRAGI } from "../../../index.js";
import * as fs from 'fs';

CHIPPRAGI.registerSystem('SystemSelectorSystem', {
  info: {
    version: "0.1.0",
    license: "Apache-2.0",
    developer: "CHIPPRBOTS",
    description: "A system that selects the most appropriate system for a given task description.",
  },

  init: function () {
    //should trigger only if a entity has a description
    CHIPPRAGI.subscribe('UPDATE', (type, eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('SYSTEM', (type, eventData) => {
      //console.log(eventData[0].eventType);
      if (eventData[0].eventType === 'newEntity') {
        //console.log('System Selector: running now!');
        setTimeout(async ()=>{
          this.handleSelectSystem(eventData[0])}
          ,7000);
        }
        });
  },
  
  remove: function () {
    // Do something when the component or its entity is detached, if needed.
     },

  handleSelectSystem: async function (data) {
    const systemDescriptions = [];

    // Iterate through all registered systems and extract the description
    for (const systemName in CHIPPRAGI.systems) {
      const system = CHIPPRAGI.systems[systemName];
      systemDescriptions.push({
        systemName: systemName,
        description: system.info.description,
      });
    }

    
    // Prepare the prompt with the list of system descriptions
    //console.log('|----outgoing----|' );
    let outbound = fs.readFileSync('./src/prompts/SystemSelectorPrompt.json','utf-8', (error, data) => {
      if (error) throw error;
      return data;
    }); 
    //2) get context
    //
    //3) replace varaible with context
    //console.log(`event data: ${JSON.stringify(data)}`);
    let taskDescription;
    if (CHIPPRAGI.getComponentData(data.entityID, 'TaskDescription') != null){
      taskDescription = CHIPPRAGI.getComponentData(data.entityID, 'TaskDescription').task;
    } else if (CHIPPRAGI.getComponentData(data.entityID, 'ObjectiveDescription') != null){
      taskDescription = CHIPPRAGI.getComponentData(data.entityID, 'ObjectiveDescription').objective;
    };
    
    //console.log(`SSS: objetive: ${JSON.stringify(taskDescription)}`);
    //console.log(`SSS: objetive: ${JSON.stringify(CHIPPRAGI.getComponentData(data.entityID, 'ObjectiveDescription'))}`);
    let prompt = [];
    JSON.parse(outbound).task_prompt.forEach( t => {
      t = t.replace('{{ taskDescription }}', taskDescription);
      t = t.replace('{{ systemDescriptions }}', JSON.stringify(systemDescriptions));
      prompt.push(t);
      },prompt);

    //console.log(`SystemSelectorSystem : outbound prompt: ${prompt.join('\n')}`);
      
    // Send the prompt to the language model
    const response = await CHIPPRAGI.langModel.createCompletion({
      model: CHIPPRAGI.langModel.MODEL_NAME,
      prompt: prompt.join('\n'),
      max_tokens: 50,
      n: 1,
      stop: null,
      temperature: 0.7,
    });
    
    // Extract the system name from the response
    let systemName = response.data.choices[0].text.trim();
    console.log(`SystemSelectorSystem : ${JSON.stringify(systemName)}`);

    let payloadData = {
      recommendedSystem : systemName,
    };

    //add a system selector component
    CHIPPRAGI.addComponent( data.entityID, 'SystemSelection', payloadData);

    
    //_eventType, _entityID, _componentName, _sourceSystem, _data
    CHIPPRAGI.MessageBus.systemMessage( 'systemSelected', data.entityID, 'SystemSelection', this.info, payloadData);
  }
});
