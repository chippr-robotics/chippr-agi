require('dotenv').config();
const fs = require('fs');
const yaml = require('js-yaml');
const { VectorDb, PromptManager, openai_config } = require('./src');
const firstTask = require('./prompts/firstTask.json');

class ChipprAGI {
    constructor(objective) {
      this.objective = objective; //string of the mission of the bot
      this.state = {}; // Initialize state
      this.tasklist = []; // Initialize tasklist (todo:)move this to the db so that it is more efficent
      this.biases = {
        "rewardScore": 1,
        "difficultyScore" : 1,
        "importanceScore" : 1,
        "dependencyScore" : 1,
      }; // Initialize biases
      this.promptManager = new PromptManager(yaml.load(fs.readFileSync('./prompts/prompts.yml', 'utf8'))); // Initialize prompt manager
      this.vectorDb = new VectorDb( process.env.AGENT_ID, process.env.INDEX_NAME, {url: process.env.REDIS_URL} ); // Initialize vector database
      this.openai = openai_config;
      this.vectorDb.create(); //create the index for the db
    }
  
    async run() {
      // Initialize the tasklist with the first task
      await this.addTask(firstTask);

      console.info('Creating first task!');
      //try to create the db if needed
      //await this.vectorDb.create();

      while (true) {
        // Get the next task to perform
        const currentTask = this.tasklist.shift();
      
        console.info("|---------Current task:--------|");
        console.info(currentTask);
      
        // Execute the current task
        const response = await this.executeTask(currentTask);
  
        // Update the state with the response
        //this.state[currentTask.task_id] = response;
  
        // Check if the current task is complete
        console.info("|----- checking if complete -----|");
        if (this.isTaskComplete(currentTask, response)) {
          // Mark the task as done
          currentTask.done = true;
  
          // Update parent tasks' reward_for_action
          this.updateParentReward(currentTask);
  
          // Prioritize the remaining tasks
          this.prioritizeTasks();
  
          // Check if all tasks are complete
          if (this.isObjectiveComplete()) {
            console.log('Objective complete!');
            await this.vectorDb.quit();
            break;
          }
        } else {
          // Generate new tasks based on the current task
          console.info("|----- getting new tasks -----|");
          let newTasks = await this.generateNewTasks(currentTask.task, response);
          
          console.info('newTasks!')
          console.log(newTasks);

          // Add the new tasks to the tasklist
          await JSON.parse(newTasks).forEach( async task => {
            await this.addTask(task);
          });
          console.debug('current tasklist');
          console.debug(this.tasklist);
          // Prioritize the remaining tasks
          this.prioritizeTasks();
        }
      }
    }
  
    async generateNewTasks(currentTask, response) {
      // Get the next task to perform from the prompt manager
      const nextTask = await this.promptManager.getNextTaskPrompt(this.objective, currentTask, response, this.tasklist.filter((t) => !t.done));
      //console.log(nextTask);
      // Convert the task prompt to a task object
      const tasks = this.promptManager.generate(this.openai, nextTask);

      return tasks;
    }
  
    async executeTask(task) {
      console.info("|-----Executing task!-----|")
      //get neighbors of the current task for context
      let vector = await this.getEmbeddings(task.task);
      //console.log(vector);
      //get the closest neighbors
      let neighbors = await this.vectorDb.getNeighbors(vector);
      //console.log(context);
      //get and store the tasks
      let context = [];
      neighbors.documents.forEach(t => { context.push(this.tasklist.find(o => o.taskid === t.id)) });
      // Get the execution prompt for the task
      console.info("|----- getting prompt -----|");
      let executionPrompt = this.promptManager.getExecutionPrompt(this.objective, JSON.stringify(context), JSON.stringify(this.state), JSON.stringify(task.action));
      console.log(executionPrompt);
      // Execute the task using ChatGPT and return the response
      console.info("|----- getting response -----|");
      let response = await this.promptManager.generate( this.openai, executionPrompt);
      //console.debug(response);
      //mark task complete?
      task.done = true;
      return response;
    }
  
    async getEmbeddings(task){
      let clean_text = task.replace("\n", " ")
      //console.log(clean_text);
      let response= await this.openai.createEmbedding({
          model : "text-embedding-ada-002",
          input : clean_text
      });
      //console.log(response.data.data[0].embedding);
      let floatbuffer = this.float32Buffer(response.data.data[0].embedding);
      return floatbuffer;
    }

    float32Buffer(arr) {
      return Buffer.from(new Float32Array(arr).buffer);
    }

    async addTask(task){
      console.log('|--adding new task--|');
      //console.debug(task);
      //console.debug('before');   
      //console.debug(this.tasklist);   
      //this.tasklist.push(task); 
      //console.debug('after');   
      //console.debug(this.tasklist);   
      let vector = await this.getEmbeddings(task.task);
      await this.vectorDb.save(task, vector);
    }

    isTaskComplete(task, response) {
      // Check if the task is complete based on the response
      // You may want to customize this based on the specific task
      //return response !== null && response !== undefined && response.trim() !== '';
    }
  
    updateParentReward(task) {
      // Update the reward_for_action of parent tasks that depend on this task
      // You may want to customize this based on the specific task and its dependencies
      // Find all tasks that have the completed task as a dependency
      const parentTasks = this.tasklist.filter(task => {
        return task.dependencies.includes(task.task_id);
      });
      
      // Update the reward_for_action field of each parent task
      parentTasks.forEach(parent => {
        parent.reward_for_action += task.reward;
      });
      
      // Recursively update the parent tasks of the updated tasks, only if they are not root tasks
      parentTasks.forEach(parent => {
        if (parent.dependencies.length > 0) {
          updateParentRewards(task, parent);
        }
      });
    }
  
    prioritizeTasks() {
      // Prioritize the tasks based on their rewards and biases
      // You may want to customize this based on your specific prioritization algorithm
      // todo add to constructor so we can optimize
      // Filter out tasks that have dependencies that are not done
      console.log('|--filtering--|')
      const availableTasks = this.tasklist.filter(task => {
        //console.log(task);
        return task.dependencies.every(dep => {
          const depTask = this.tasklist.find(t => t.task_id === dep);
          return depTask.done;
        });
      });
      console.log(availableTasks);
      // Calculate the priority score for each task
      const priorityScores = availableTasks.map(task => {
        const rewardScore = task.reward * this.biases.rewardBias;
        const difficultyScore = 1 / (task.estimated_difficulty * this.biases.difficultyBias);
        const importanceScore = task.estimated_importance * this.biases.importanceBias;
        const dependencyScore = task.dependencies.length * this.biases.dependencyBias;
      
        return {
          task: task,
          score: rewardScore + difficultyScore + importanceScore + dependencyScore
        };
      });
      
      // Sort tasks by priority score
      priorityScores.sort((a, b) => b.score - a.score);
      console.log("priorityScores");
      console.log(priorityScores);
      // Return the sorted list of tasks
      this.tasklist = priorityScores.map(ps => ps.task);
      //console.log("current state");
      console.log(this.tasklist);
      //console.log(this);
    }
      
    isObjectiveComplete() {
      // Check if all tasks in the objective are complete
      return this.tasklist.filter((t) => !t.done).length === 0;
    }
    
    generateTaskEmbedding(task){};
}

module.exports = { ChipprAGI };