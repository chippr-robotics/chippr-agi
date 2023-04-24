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
    CHIPPRAGI.subscribe('UPDATE',update(eventData));
    CHIPPRAGI.subscribe('REMOVE',update(eventData));
    CHIPPRAGI.subscribe('TICK',update(eventData));
    CHIPPRAGI.subscribe('SYSTEM', (eventData) => {
      if (eventData.eventType === 'newEntity') {
        setTimeout(async ()=>{
          this.handleSelectSystem(eventData.payload.data)}
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
    //none needed yet for fresh tasks....
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
    const systemName = response.data.choices[0].text.trim();
    //console.log(`SystemSelectorSystem : ${JSON.stringify(systemName)}`);
    CHIPPRAGI.emit('SystemSelector', { systemName : systemName });  
    return systemName;
  }
});
