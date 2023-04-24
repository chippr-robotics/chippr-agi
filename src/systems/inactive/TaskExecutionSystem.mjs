import { CHIPPRAGI } from "../../../index.js";

CHIPPRAGI.registerSystem('TaskExecutionSystem', {
    info: {
      version : "0.1.0",
      license : "APACHE-2.0",
      developer: "CHIPPRBOTS",
      description : "This system listens for execute task message and sends the task along with context to get longer text ",
    },

    init: function (eventData) {
      CHIPPRAGI.subscribe('UPDATE', (type, eventData) => {this.update(eventData)});
      CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
      CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
      CHIPPRAGI.subscribe('SYSTEM', (type, eventData) => {
          this.handleExecuteTask(eventData[0].payload.data)    
        },
        5000);
    },
  
    remove: function (eventData) {
      // Do something when the component or its entity is detached, if needed.
    },
    

    handleExecuteTask(data) {
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