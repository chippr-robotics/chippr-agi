import { CHIPPRAGI } from "../../index.js";
import { SystemSelectorPrompt } from '../../prompts/SystemSelectorPrompt.js'

CHIPPRAGI.registerSystem('SystemSelectorSystem', {
  info: {
    version: "0.1.0",
    license: "Apache-2.0",
    developer: "CHIPPRBOTS",
    type: "core",
    description: "A system that selects the most appropriate system for a given task description.",
  },

  init: function () {
    //should trigger only if a entity has a description
    CHIPPRAGI.subscribe('UPDATE', (message) => {this.update(message)});
    CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
  },
  

  update: function (message) {
    let eventData = JSON.parse(message);
    // Do something when the component or its entity is detached, if needed.
    if (eventData.eventType === 'addSystemSelection') { this.handleSelectSystem(eventData)}
  },

  handleSelectSystem: async function (data) {
    let systemDescriptions = [];
    let taskDescription;
    let entityID = data.payload.entityID;
    let prompt = [];
    // Iterate through all registered systems and extract the description
    for (const systemName in CHIPPRAGI.systems) {
      if ( CHIPPRAGI.systems[systemName].info.type != 'core') {
        const system = CHIPPRAGI.systems[systemName];
        systemDescriptions.push({
          systemName: systemName,
          description: system.info.description,
        });
      }
    }

    //3) replace varaible with context
    let taskFinder = await CHIPPRAGI.getComponentData(entityID, 'TaskDescription'); 
    if (taskFinder == null) { taskFinder = await CHIPPRAGI.getComponentData(entityID, 'ObjectiveDescription') }; 
    
    taskDescription = taskFinder.task || taskFinder.objective;
  
    (SystemSelectorPrompt.task_prompt).forEach( t => {
      t = t.replace('{{ taskDescription }}', taskDescription);
      t = t.replace('{{ systemDescriptions }}', JSON.stringify(systemDescriptions));
      prompt.push(t);
      },prompt);
    // Send the prompt to the language model
    
    let success = false;
    //throw error;
    let systemName = await CHIPPRAGI.LangModel.generate(prompt.join('\n'));
    let payloadData = {
      recommendedSystem : systemName,
    };
    

    while (!success){        
      try {
        //_eventType, _entityID, _componentName, _sourceSystem, _data
        JSON.parse(systemName).forEach(system => {
          //console.log(system)
          CHIPPRAGI.MessageBus.updateMessage( 'systemSelected', entityID, 'SystemSelection', this.info, system.recommendedSystem);
        })
        //add a system selector component
        CHIPPRAGI.addComponent( entityID, 'SystemSelection', payloadData);      
        success = true;
      } catch(error) {
        //console.log(error);
        //console.log(JSON.parse(systemName));
          // the response was not json so we need to try again console.logging for trouble shoooting
        systemName = await CHIPPRAGI.LangModel.generate(prompt.join('\n'));
      };
        
    }
  }  
});
