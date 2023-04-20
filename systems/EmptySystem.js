import { CHIPPRAGI } from "../index.js";

CHIPPRAGI.registerSystem('EmptySystem', {
    init: function (_eventEmitter) {
        _eventEmitter.on('emptySystem', (data) => {
          this.emptySystem(data);
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
    
    //methods go here
    emptySystem(){},
  
  });
  