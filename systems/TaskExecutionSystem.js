var System = require('../core/system');
class TaskExecutionSystem extends System {
    constructor(eventEmitter) {
      super(eventEmitter);
    }
  
    registerEventListeners() {
      this.eventEmitter.on('executeTask', (taskId) => {
        this.executeTask(taskId);
      });
    }
  
    update() {
      // Implement task execution logic here
    }
  
    executeTask(taskId) {
      // Execute the task associated with the given taskId
      // You can access the components associated with the taskId to perform the task execution
      // 1) get embedding which should be stored in the db
      // 2) get neighbors using knn from vectorDB
      // 3) get the execution prompt
      // 4) generate using the prompt
      // 5) emit storeTask( taskID, response,)
      // 6) emit taskCheck( taskID )
    }
  }
  
  module.exports.init = (eventEmitter) => {new TaskExecutionSystem(eventEmitter)};