import { CHIPPRAGI } from "../index.js";
import { LangModel } from "../langmodel.js";
import * as yaml from 'js-yaml';

CHIPPRAGI.registerSystem('SystemSelectorSystem', {
  info: {
    version: "0.1.0",
    license: "Apache-2.0",
    developer: "",
    description: "A system that selects the most appropriate system for a given task description.",
  },

  function (_eventEmitter) {
    _eventEmitter.on('newEntity', (data) => { this.handleSelectSystem(data); })
    },

  HandleSelectSystem: async function (taskDescription) {
    const systemDescriptions = [];

    // Iterate through all registered systems and extract the description
    for (const systemName in CHIPPRAGI.systems) {
      const system = CHIPPRAGI.systems[systemName];
      systemDescriptions.push({
        name: systemName,
        description: system.info.description,
      });
    }

    
    // Prepare the prompt with the list of system descriptions
    const SystemPrompt = yaml.load(fs.readFileSync('./prompts/SystemSelectorPrompt.yml', 'utf8')); 
    let prompt = SystemPrompt.task_prompt.replace('{{ taskDescription }}', taskDescription);
    prompt = prompt.task_prompt.replace('{{ taskDescription }}', JSON.stringify(systemDescriptions));
    
    // Send the prompt to the language model
    const response = await LangModel.createCompletion({
      prompt: prompt,
      max_tokens: 50,
      n: 1,
      stop: null,
      temperature: 0.7,
    });

    // Extract the system name from the response
    const systemName = response.choices[0].text.trim();
    console.log(systemName);
    return systemName;
  }
});
