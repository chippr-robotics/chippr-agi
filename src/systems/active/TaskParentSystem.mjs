import { CHIPPRAGI } from "../../index.js";

CHIPPRAGI.registerSystem('TaskParentSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    type: "core",
    description : "This system listens a new objective from a user creates an entityID for the objective.",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE', (eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('SYSTEM', (message) => {});
  },

  update: function (message) {
    // Do something when the component's data is updated, if needed.
    // entityId is the ID of the entity this component is attached to.
    // componentData contains the updated data for the component.
      let eventData = JSON.parse(message);
      if (eventData.eventType === 'addTaskParent') {
        this.handleCreateEntity(eventData);
      }
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
  
  handleCreateEntity: async function (data) {
        let parentData = {
            parentId : data.payload.data.parentID
        };
        CHIPPRAGI.addComponent( data.payload.entityID, 'TaskParent', parentData );
        CHIPPRAGI.MessageBus.updateMessage( 'addedParent', data.payload.entityID, 'TaskParent', this.info, parentData);
        
        
    
    }
});