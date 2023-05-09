import { CHIPPRAGI } from "../../index.js";

CHIPPRAGI.registerSystem('EmptySystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This is an empty example system.",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE', (type, eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (type, eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (type, eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('SYSTEM', (type, eventData) => {
      this.handleEmptySystem(eventData.payload.data);
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
    
  //methods go here
  handleEmptySystem: async function (){
    //magic happens here
  },
 
});
  