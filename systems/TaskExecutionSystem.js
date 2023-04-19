CHIPPRAGI.registerSystem('TaskExecutionSystem', {
    init: function (_eventEmitter) {
      _eventEmitter.on('executeTask', (taskId) => {
        this.executeTask(taskId);
      });
    },
  
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
  });