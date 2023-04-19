var System = require('../core/system');
const { createHash } = require('node:crypto');

class TaskCreationSystem extends System {
    constructor(eventEmitter) {
      super(eventEmitter);
    }
  
    registerEventListeners() {
      this.eventEmitter.on('createTask', (taskDescription) => {
        this.createTask(taskId);
      });
    }
  
    update() {
      // should do nothing on update call, the event listner triggers this function
    }
  
    createTask(taskDescription) {
      // create the task associated with the given taskId
      // 0) create a task ID
      let taskID = this.getHashId(taskDescription);
      // 1) store the task in the AGI Entity list
      CHIPPRAGI.createEntity(taskID);
      // 2) add a TaskDescription component
      CHIPPRAGI.addComponent( taskID, 'TaskDescription', {
        taskId : taskID,
        task : taskDescription,
        done : false,
        dependencies : [],
      });
      // 3) emit an event to store embeddings
    }

    getHashId(_taskDescription){
        //create a hash
        let hash =  createHash('sha256');
        hash.write(_taskDescription);
        hash.end();
        //use the first 10 bytes of the hash as the hashID
        let hashID = hash.read().toString('hex').slice(0,10)
        return hashID
      }
  }
  
  module.exports.init = (eventEmitter) => {new TaskCreationSystem(eventEmitter)};