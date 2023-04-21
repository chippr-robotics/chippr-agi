import { CHIPPRAGI } from "../index.js";
import * as fs from 'fs';

CHIPPRAGI.registerSystem('CoreSystemLoader', {
  info: {
    version : "0.1.0",
    license : "Apache-2.0",
    developer: "",
    description : "",
  },
  
  init: function () {
    // do something when the system is first loaded  
    this.handleLoadSystem();
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

  handleLoadSystem : function () {
    console.log('CoreSystemLoader running');
    let systems = './systems/';
    let components = './components/';
    setInterval(() => {
      //console.log(`found ${fs.readdirSync(systems)}`); 
      fs.readdirSync(systems).forEach(file => {  
        if(CHIPPRAGI.systems[file.split(".")[0]] == undefined) {
          
          import ('./' + file);  
          //console.log(`ran import on ${file}`); 
          //sleep to let the system rest then init
          setTimeout(()=>{
            //console.log('inside timeout')
            //console.log(file);
            CHIPPRAGI.systems[file.split(".")[0]].init(CHIPPRAGI.eventEmitter);
          }, 3000, file);
        }
      });
      fs.readdirSync(components).forEach(file => { 
        if(CHIPPRAGI.components[file.split(".")[0]] == undefined) import ('../components/'+file);
      });  
      }, 5000);
  }
});

