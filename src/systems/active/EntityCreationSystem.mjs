import { CHIPPRAGI } from "../../index.js";

CHIPPRAGI.registerSystem('EntityCreationSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This system listens a new objective from a user creates an entityID for the objective.",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE', (eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('SYSTEM', (message) => {
      //CHIPPRAGI.Logger.debug({system: 'EntityCreationSystem', log:'made it this far'});

    });
  },

  update: function (message) {
    // Do something when the component's data is updated, if needed.
    // entityId is the ID of the entity this component is attached to.
    // componentData contains the updated data for the component.
    let eventData = JSON.parse(message);
    if (eventData.eventType === 'createEntity') {
      //CHIPPRAGI.Logger.debug({system: 'EntityCreationSystem', log:`createObjective ${eventData}`});
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
  
  handleCreateEntity: async function (event) {
    // create the task associated with the given taskId
    let data = event.payload.data;
    //CHIPPRAGI.Logger.debug({system: 'EntityCreationSystem', log:'createObjective triggered'});
    let entityID = CHIPPRAGI.Util.getHashId(data.task);
    // 1) store the task in the AGI Entity list
    CHIPPRAGI.createEntity(entityID);
    // 2) add a objectiveDescription component
    switch (event.payload.componentName){ 
      case 'ObjectiveDescription' :
        let objectiveData = {
          objective : data.task,
          complete : false,
        };
        CHIPPRAGI.addComponent( entityID, 'ObjectiveDescription', objectiveData);    
        CHIPPRAGI.MessageBus.updateMessage( 'generateTasks', entityID, 'ObjectiveDescription', this.info, objectiveData);
      break;
      case 'TaskDescription' :
        let taskData = {
          task : data.task,
          complete : false,
        };
        CHIPPRAGI.MessageBus.updateMessage('addTaskParent', entityID, 'TaskParent', this.info, {
          parentID : data.parentID
        });
        CHIPPRAGI.addComponent( entityID, 'TaskDescription', taskData);    
        CHIPPRAGI.MessageBus.updateMessage( 'addSystemSelection', entityID, 'TaskDescription', this.info, taskData);
      break;
    }
    
    
    
    //_eventType, _entityID, _componentName, _sourceSystem, data
    
  }
 
});