const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

class ChipprAGI {
  constructor() {
    this.entities = {};
    this.components = {};
    this.systems = [];
    this.eventEmitter = new EventEmitter();
    this.systemLoader();
  }

  createEntity() {
    const entityId = uuidv4();
    this.entities[entityId] = {};
    return entityId;
  }

  addComponent(entityId, componentName, componentData) {
    this.entities[entityId][componentName] = componentData;
  }

  registerComponent(componentName, component) {
    this.components[componentName] = component;
  }

  registerSystem(system) {
    this.systems.push(system);
  }

  systemLoader(){
    let systems = './systems/';
    let components = './components/';
     setInterval(() => {
          fs.readdirSync(systems).forEach(file => {  
            let sys = file.split('.')[0];
            if(!this.systems.includes(sys)){
              let s = require(systems+file);
              s.init(this.eventEmitter);
              this.registerSystem(sys);
            };
          });  
          fs.readdirSync('./components').forEach(file => { 
             require(components+file);
          });  
    }, 5000);
  }

  emit(eventType, eventData) {
    this.eventEmitter.emit(eventType, eventData);
  }

  on(eventType, listener) {
    this.eventEmitter.on(eventType, listener);
  }
}

module.exports = { ChipprAGI };
