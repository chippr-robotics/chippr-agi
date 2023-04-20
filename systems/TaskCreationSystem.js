import { CHIPPRAGI } from "../index.js";

import { createHash } from 'node:crypto';

CHIPPRAGI.registerSystem('TaskCreationSystem', {
  init: function (_eventEmitter) {
      _eventEmitter.on('createTask', (data) => {
        this.createTask(data);
      });
  },

  update: function (entityId, componentData) {
    // Do something when the component's data is updated, if needed.
    // entityId is the ID of the entity this component is attached to.
    // componentData contains the updated data for the component.
  },

  remove: function () {
    // Do something when the component or its entity is detached, if needed.
    clearInterval();
  },

  tick: function (entityId, time, timeDelta) {
    // Do something on every scene tick or frame, if needed.
    // entityId is the ID of the entity this component is attached to.
    // time is the current time in milliseconds.
    // timeDelta is the time in milliseconds since the last tick.
  },
  
  createTask (data) {
    // create the task associated with the given taskId
    // 0) create a task ID
    let taskID = this.getHashId(data.task);
    // 1) store the task in the AGI Entity list
    CHIPPRAGI.createEntity(taskID);
    // 2) add a TaskDescription component
    CHIPPRAGI.addComponent( taskID, 'TaskDescription', {
      taskId : taskID,
      task : data.task,
      done : false,
      dependencies:[],
    });
    CHIPPRAGI.emit('newEntity', { entityID : taskID });
  },
 
  getHashId(_taskDescription){
    //create a hash
    let hash =  createHash('sha256');
    hash.write(_taskDescription);
    hash.end();
    //use the first 10 bytes of the hash as the hashID
    let hashID = hash.read().toString('hex').slice(0,10)
    return hashID
  }

});
