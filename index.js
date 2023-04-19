const EventEmitter = require('events');
const fs = require('fs');
const { VectorDb, LangModel } = require('./core');


class ChipprAGI {
  constructor() {
    this.entities = {};
    this.components = {};
    this.systems = [];
    this.eventEmitter = new EventEmitter();
    this.langModel = LangModel;
    this.vectorDb = new VectorDb( process.env.AGENT_ID, process.env.INDEX_NAME, {url: process.env.REDIS_URL} ); // Initialize vector database
  }

  createEntity(_entityID) {
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

  loadSystem(_systemFile) {
    let sys = _systemFile.split('.')[0];
    let s = require("./systems/" + _systemFile);
    //run the init function on a system
    s.init(this.eventEmitter);
    //register the new system 
    this.registerSystem(sys);
  }
  
  emit(eventType, eventData) {
    this.eventEmitter.emit(eventType, eventData);
  }

  on(eventType, listener) {
    this.eventEmitter.on(eventType, listener);
  }
}

module.exports = { ChipprAGI };
