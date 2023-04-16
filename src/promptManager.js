//manage prompts befor sending
class PromptManager {
    constructor(prompts) {
      this.prompts = prompts;
    }
  
    getNextTaskPrompt(_objective, _completedTask, _response, _tasklist){
      return this.prompts.task_prompt.replace('{{ objective }}', _objective)
      .replace('{{ lastCompletedResult }}', _response)
      .replace('{{ lastCompletedTask }}', _completedTask)
      .replace('{{ incompleteTasks }}', _taskList.map((t) => `- ${t.task}`).join('\n'))
    };
    
    getExecutionPrompt(_objective, _context, _state, _activeTask){
      return this.prompts.execution_prompt.replace('{{ objective }}', _objective)
      .replace('{{ context }}', _context)
      .replace('{{ state }}', _state)
      .replace('{{ activeTask }}', _activeTask)
    }
  
    async generate(openai, _prompt) {
      let response = await openai.createCompletion({
          model: process.env.MODEL,
          messages:[
              {"role": "system", "content": "You are an intelligent agent with thoughts and memories. You have a memory which stores your past thoughts and actions and also how other users have interacted with you."},
              {"role": "system", "content": "Keep your thoughts relatively simple and concise"},
              {"role": "user", "content": _prompt},
          ] ,
          temperature: 0.5,
          max_tokens: 100,
      });
     return response.choices[0].text;
  }
}
  