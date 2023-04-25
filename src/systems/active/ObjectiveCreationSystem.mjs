import { CHIPPRAGI } from "../../index.js";

CHIPPRAGI.registerSystem('ObjectiveCreationSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This system listens for an event containg a new objective and creates an entity for the objective.",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE', (type, eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('SYSTEM', (type, eventData) => {
      //console.log('made it this far');
      //console.log(JSON.stringify(eventData[0]));
      if (eventData[0].eventType === 'createObjective') {
        //console.log(`createObjective ${eventData}`);
        this.handleCreateObjective(eventData[0].payload.data);
      }
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
    //console.log('createObjective triggered');
    //console.log(JSON.stringify(`ocs raw data ${JSON.stringify(data)}`));
    let objectiveID = CHIPPRAGI.Util.getHashId(data.objectiveDescription);
    // 1) store the task in the AGI Entity list
    CHIPPRAGI.createEntity(objectiveID);
    // 2) add a objectiveDescription component
    let componentData = {
      objective : data.objectiveDescription,
      complete : false,
    };

    CHIPPRAGI.addComponent( objectiveID, 'ObjectiveDescription', componentData);
    //_eventType, _entityID, _componentName, _sourceSystem, data
    CHIPPRAGI.MessageBus.systemMessage( 'newObjective', objectiveID, 'ObjectiveDescription', this.info, componentData);
  }
 
});