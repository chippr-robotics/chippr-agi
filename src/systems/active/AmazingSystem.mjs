import { CHIPPRAGI } from "../../index.js";

CHIPPRAGI.registerSystem('AmazingSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    type: "core",
    description : "This is an system that can solve any problem.",
  },

  init: function () {
    //NOTE THIS IS FOR TESTING THE SYSTEM ONLY 
    CHIPPRAGI.subscribe('UPDATE', (eventData) => {this.update(eventData)});
  },
  
  update: async function (eventData) {
    // Do something when the component's data is updated, if needed.
    // entityId is the ID of the entity this component is attached to.
    // componentData contains the updated data for the component.
    let eventData = JSON.parse(message);
    if (eventData.eventType === 'saveData') {
      let cid = await CHIPPRAGI.Util.storeData("this is a test");
      CHIPPRAGI.Logger.error({ systemName: 'awesome system', log: cid});
      let file = await CHIPPRAGI.Util.getData(cid);
      CHIPPRAGI.Logger.error({ systemName: 'awesome system', log: file});
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
    
  //methods go here
  handleEmptySystem: async function (){
    //magic happens here
  },
 
});
  