const EventEmitter = require('events');
const fs = require('fs');
const { VectorDb, LangModel } = require('./core');


class ChipprAGI {
  constructor() {
    this.entities = {};
    this.components = {};
    this.systems = {};
    this.eventEmitter = new EventEmitter();
    this.langModel = LangModel;
    this.vectorDb = new VectorDb( process.env.INDEX_NAME, {url: process.env.REDIS_URL} ); // Initialize vector database
  }

  createEntity(_entityID) {
    this.entities[_entityID] = {};
  }

  addComponent(entityId, componentName, componentData) {
    this.entities[entityId][componentName] = componentData;
    this.components[componentName].init(entityId, componentData);
  }

  registerComponent(componentName, component) {
    this.components[componentName] = component;
  }

  registerSystem(systemName, systemFuncs) {
    this.systems[systemName] = systemFuncs;
    this.systems[systemName].init(this.eventEmitter);
  }
  
  emit(eventType, eventData) {
    this.eventEmitter.emit(eventType, eventData);
  }

  on(eventType, listener) {
    this.eventEmitter.on(eventType, listener);
  }
}

module.exports = { ChipprAGI };
