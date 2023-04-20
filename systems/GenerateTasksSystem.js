import { CHIPPRAGI } from "../index.js";

CHIPPRAGI.registerSystem('GenerateTasksSystem', {
    init: function (_eventEmitter) {
        _eventEmitter.on('newObjective', (data) => {
          this.GenerateTasksSystem(data);
        });

    },
  
    update: function (entityId, componentData) {
      // Do something when the component's data is updated, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the updated data for the component.
    },
  
    remove: function () {
      // Do something when the component or its entity is detached, if needed.
    },
  
    //methods go here
    async GenerateTasksSystem(data){
        //(_objective, _completedTask, _response, _tasklist){
        //1) get prompt for generate task
        let GenerateTasksPrompt = yaml.load(fs.readFileSync('./prompts/GenerateTasksPrompt.yml', 'utf8')); 
        //2) get context
        //none needed for fresh tasks....
        //3) replace varaible with context
        let prompt = GenerateTasksPrompt.task_prompt.replace('{{ objective }}', _objective);
        //4) generate tasks
        let newTasks = await this.generate(prompt);
        //5) generate event to create for each tasks 
        JSON.parse(newTasks).forEach( async task => {
            CHIPPRAGI.emit('createTask', task);
        })         
    },
    async generate(_prompt) {
        let response = await CHIPPRAGI.langModel.createCompletion({
            model: process.env.MODEL,
            prompt: _prompt,
            temperature: 0.5,
            max_tokens: 2000,
        });
        return response.data.choices[0].text;
    },

  
  });
  