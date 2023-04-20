const { createHash } = require('node:crypto');

CHIPPRAGI.registerSystem('ObjectiveCreationSystem', {
  init: function (_eventEmitter) {
      _eventEmitter.on('createObjective', (objectiveDescription) => {
        this.createObjective(objectiveDescription);
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
  
  createObjective (objectiveDescription) {
    // create the task associated with the given taskId
    // 0) create a objective ID
    let objectiveID = this.getHashId(objectiveDescription);
    // 1) store the task in the AGI Entity list
    CHIPPRAGI.createEntity(objectiveID);
    // 2) add a objectiveDescription component
    CHIPPRAGI.addComponent( objectiveID, 'ObjectiveDescription', {
      objectiveId : objectiveID,
      objective : objectiveDescription,
      complete : false,
    });
    CHIPPRAGI.emit('newObjective', { objectiveID : objectiveID });
  },
 
  getHashId(_objectiveDescription){
    //create a hash
    let hash =  createHash('sha256');
    hash.write(_objectiveDescription);
    hash.end();
    //use the first 10 bytes of the hash as the hashID
    let hashID = hash.read().toString('hex').slice(0,10)
    return hashID
  }

});
