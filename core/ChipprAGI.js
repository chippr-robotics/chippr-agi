import * as dotenv from 'dotenv';
dotenv.config();
 
import  'fs';
import { VectorDB } from './vector-db.js'
import { LangModel } from './langModel.js';
import { MsgBus } from './msgBus.js';

class ChipprAGI {
  constructor() {
    this.entities = {};
    this.components = {};
    this.systems = [];
    this.eventEmitter = MsgBus;
    this.langModel = LangModel;
    this.vectorDb = new VectorDB( process.env.INDEX_NAME, {url: process.env.REDIS_URL} ); // Initialize vector database
  }

  createEntity(_entityID) {
    this.entities[_entityID] = {};
  }

  addComponent(entityId, componentName, componentData) {
    //check if we store components in the db or not
    if(!process.env.SWARM_MODE){
      this.entities[entityId][componentName] = componentData;
      this.components[componentName].init(entityId, componentData);
      return true;
    } else {
      this.vectorDb.save( `idx:${componentName}:${entityId}`, '$',  componentData);
      this.vectorDb.get(`idx:${componentName}:${entityId}`).then((component)=>{
        //run the local function on the component
        this.components[componentName].init(entityId, componentData);
      })
    }

  }

  registerComponent(componentName, component) {
    if(!process.env.SWARM_MODE){
      this.components[componentName] = component;
      return true;
    } else {
      this.vectorDb.create( `idx:${componentName}`, component.schema , {
        ON: 'JSON',
        PREFIX: `idx:${componentName}:`,
      });
      //save for loacl use
      this.components[componentName] = component;
    }
    
  }

  registerSystem(system) {
    this.systems.push(system);
    system.init(this);
  }
  // Proxy methods to the underlying model
  emit(eventType, eventData) {
    this.eventEmitter.emit(eventType, eventData);
    if (process.env.WATCH) this.eventEmitter.emit('*', eventData); //system monitoring  
  }
  
  on(eventType, listener) {
    this.eventEmitter.on(eventType, listener);
  }  // Add other methods as needed
}

export const CHIPPRAGI = new ChipprAGI();

