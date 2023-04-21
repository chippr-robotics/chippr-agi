import * as dotenv from 'dotenv';
dotenv.config();
 
import  'fs';
import { VectorDB } from './vector-db.js'
import { LanguageModel } from './langModel.js';
import { MessageBus } from './msgBus.js';

class ChipprAGI {
  constructor() {
    this.entities = {};
    this.components = {};
    this.systems ={};
    this.eventEmitter = new MessageBus();
    this.langModel = new LanguageModel();
    this.vectorDb = new VectorDB( {url: process.env.REDIS_URL} ); // Initialize vector database
  }

  createEntity(_entityID) {
    if(process.env.SWARM_MODE != true){
      console.log('creating entity');
      this.entities[_entityID] = {};
      return true;
    } else {
      this.vectorDb.save( `idx:entities:${_entityID}`, '$',  {});
    }
  }

  addComponent(entityId, componentName, componentData) {
    //check if we store components in the db or not
    if(process.env.SWARM_MODE != true){
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
    //console.log(`swarmmode:${process.env.SWARM_MODE}`);
    //console.log(componentName);
    if(process.env.SWARM_MODE != true){
      console.log('swarm is not on');
      this.components[componentName] = component;
      return true;
    } else {
      console.log('swarm is on');
      this.vectorDb.create( `idx:${componentName}`, component.schema , {
        ON: 'JSON',
        PREFIX: `idx:${componentName}:`,
      });
      //save for loacl use
      this.components[componentName] = component;
    } 
  }

  registerSystem(systemName, system) {
    //console.log(systemName);
    //all systems are local so store it at its name
    this.systems[systemName]= system;
  }

  // Proxy methods to the underlying model
  emit(eventType, eventData) {
    this.eventEmitter.emit(eventType, eventData);
    if (process.env.WATCH) this.eventEmitter.emit('*', eventData);//system monitoring  
  }
  
  on(eventType, listener) {
    this.eventEmitter.on(eventType, listener);
  }  // Add other methods as needed
}

export const CHIPPRAGI = new ChipprAGI();

