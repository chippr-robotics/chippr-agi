//manage prompts befor sending
//v1 file
class PromptManager {
    constructor(prompts) {
      this.prompts = prompts;
    }
  
    getNextTaskPrompt(_objective, _completedTask, _response, _tasklist){
      return this.prompts.task_prompt.replace('{{ objective }}', _objective)
      .replace('{{ lastCompletedResult }}', _response)
      .replace('{{ lastCompletedTask }}', _completedTask)
      .replace('{{ incompleteTasks }}', _tasklist.map((t) => `- ${t.task}`).join('\n'))
    };
    
    getExecutionPrompt(_objective, _context, _state, _activeTask){
      
      return this.prompts.execution_prompt.replace('{{ objective }}', _objective)
      .replace('{{ context }}', _context)
      .replace('{{ state }}', _state)
      .replace('{{ activeTask }}', _activeTask)
    }
  

  
};

module.exports = PromptManager 