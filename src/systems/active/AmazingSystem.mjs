import { CHIPPRAGI } from "../../index.js";

CHIPPRAGI.registerSystem('AmazingSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This is an system that can solve any problem.",
  },

  init: function () {
    //NOTE THIS IS FOR TESTING THE SYSTEM SELECTOR ONLY 
    CHIPPRAGI.subscribe('SYSTEM', (type, eventData) => {
      //if( type == 'systemSelected' ) //CHIPPRAGI.Logger.debug({log:`AMAZING SYSTEM WAS CORRECTLY SELECTED!`, system: 'amazingSystem'});
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
  