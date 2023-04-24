import { CHIPPRAGI } from "../../../index.js";

import { createHash } from 'node:crypto';

CHIPPRAGI.registerSystem('ObjectiveCreationSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This system listens for an event containg a new objective and creates an entity for the objective.",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE', (eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('SYSTEM', (eventData) => {
      if (eventData.eventType === 'createObjective') this.handleCreateObjective(eventData.payload.data);
    });
  },

  update: function (eventData) {
    // Do something when the component's data is updated, if needed.
    // entityId is the ID of the entity this component is attached to.
    // componentData contains the updated data for the component.
  },

  remove: function (eventData) {
    // Do something when the component or its entity is detached, if needed.
    },

  tick: function (eventData) {
    // Do something on every scene tick or frame, if needed.
    // entityId is the ID of the entity this component is attached to.
    // time is the current time in milliseconds.
    // timeDelta is the time in milliseconds since the last tick.
  },
  
  handleCreateObjective: function (data) {
    // create the task associated with the given taskId
    // 0) create a objective ID
    //console.log('createObjective');
    let objectiveID = this.getHashId(data.objectiveDescription);
    // 1) store the task in the AGI Entity list
    CHIPPRAGI.createEntity(objectiveID);
    // 2) add a objectiveDescription component
    CHIPPRAGI.addComponent( objectiveID, 'ObjectiveDescription', {
      entityID : objectiveID,
      objective : data.objectiveDescription,
      complete : false,
    });

    let newMessage = { ...CHIPPRAGI.MessageBus.MessageSchema };
    newMessage.eventType = 'newObjective';
    newMessage.payload.entityID = objectiveID;
    newMessage.payload.component = 'ObjectiveDescription';
    newMessage.payload.data = { 
      objective : data.objectiveDescription,
      complete : false
    };
    newMessage.metadata.sourceSystem = this.info;
    CHIPPRAGI.publish('SYSTEM', [newMessage]);
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
this.this.