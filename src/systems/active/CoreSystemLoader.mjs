import { CHIPPRAGI } from "../../../index.js";
import * as fs from 'fs';

CHIPPRAGI.registerSystem('CoreSystemLoader', {
  info: {
    version : "0.1.1",
    license : "Apache-2.0",
    developer: "CHIPPRBOTS",
    description : "Auto load and unload systems and components!",
  },
  
  init: function () {
    // do something when the system is first loaded  
    CHIPPRAGI.subscribe('UPDATE', (eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (eventData) => {this.tick(eventData)});
    this.handleLoadSystem();
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

  handleLoadSystem : function () {
    //console.log('CoreSystemLoader running');
    let systems = './src/systems/active/';
    //console.log(systems);
    let components = './src/components/active/';
    setInterval(() => {
      const systemFiles = fs.readdirSync(systems);
      const componentFiles = fs.readdirSync(components);

      // Load systems
      systemFiles.forEach(file => {  
        if(CHIPPRAGI.systems[file.split(".")[0]] == undefined) {
          import ('./' + file);  
          //console.log(`./${file}`);
          setTimeout(() => {
            console.log(`${file}`);
            CHIPPRAGI.systems[file.split(".")[0]].init(CHIPPRAGI.eventEmitter);
          }, 3000, file);
        }
      });

      // Remove systems not present in the directory
      for (const systemName in CHIPPRAGI.systems) {
        if (!systemFiles.includes(systemName + '.mjs')) {
         // CHIPPRAGI.removeSystem(systemName);
        }
      }

      // Load components
      componentFiles.forEach(file => { 
        if(CHIPPRAGI.components[file.split(".")[0]] == undefined) {
          import ('../../components/active/'+file);
        }
      });

      // Remove components not present in the directory
      for (const componentName in CHIPPRAGI.components) {
        if (!componentFiles.includes(componentName + '.mjs')) {
          //CHIPPRAGI.removeComponent(componentName);
        }
      }

    }, 5000);
  }
});
