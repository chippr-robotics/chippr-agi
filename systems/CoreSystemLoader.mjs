import { CHIPPRAGI } from "../index.js";
import * as path from 'path';
import * as fs from 'fs';


CHIPPRAGI.registerSystem('CoreSystemLoader', {
  init: function () {
    {
      console.log('CoreSystemLoader running');
      let systems = './systems/';
      let components = './components/';
      console.log(path.dirname("./"));
      setInterval(() => {
          fs.readdirSync(systems).forEach(file => {  
            if(CHIPPRAGI.systems[file.split(".")[0]] == undefined) import ('./' + file);
          });  
          fs.readdirSync(components).forEach(file => { 
            if(CHIPPRAGI.systems[file.split(".")[0]] == undefined) import ('../components/'+file);
          });  
      }, 5000);
    }
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
  }
});
