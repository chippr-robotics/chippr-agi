import * as dotenv from 'dotenv';
dotenv.config();
 
import  'fs';
import { VectorDB } from './vector-db.js'
import { LanguageModel } from './langModel.js';
import { MessageBus } from './msgBus.js';

export class ChipprAGI {
  constructor(chipprConfig) {
    this.SWARM_MODE = chipprConfig.CORE.SWARM_MODE;
    this.DASHBOARD = chipprConfig.CORE.DASHBOARD;
    this.WATCH = chipprConfig.CORE.WATCH;
    this.TESTING = chipprConfig.TESTING;
    this.eventEmitter = new MessageBus(chipprConfig);
    this.langModel = new LanguageModel(chipprConfig);
    this.vectorDb = new VectorDB(chipprConfig); // Initialize vector database
    this.entities = {};
    this.components = {};
    this.systems ={};
  }

  init() {
    if(this.TESTING != true){
      //this.langModel.init();
      //this.vectorDb.init();
      //this.eventEmitter.init();
    };
    //load the core systems
    import ('../systems/active/CoreSystemLoader.mjs');
    //import ('../systems/active/.mjs');
  }
  async createEntity(_entityID) {
    //console.log('creating entity');
    if(this.SWARM_MODE != true){
      //console.log('creating entity');
      this.entities[_entityID] = {};
      return true;
    } else {
      await this.vectorDb.save( `idx:entities:${_entityID}`, '$',  {});
      CHIPPRAGI.emit('newEntity', { entityID : _entityID });
    }
  }

  async getAllEntities(componentName){
    return await this.vectorDb.query(`idx:${componentName}:*`);
  }

  addComponent(entityId, componentName, componentData) {
    //check if we store components in the db or not
    if(this.SWARM_MODE != true){
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

  getComponent(entityId, componentName) {
    //check if we store components in the db or not
    if(this.SWARM_MODE != true){
      return this.entities[entityId][componentName] = componentData;
    } else {
      return this.vectorDb.get(`idx:${componentName}:${entityId}`);
    }
  }

  async registerComponent(componentName, component) {
    //console.log(`swarmmode:${this.SWARM_MODE}`);
    //console.log(componentName);
    if(this.SWARM_MODE != true){
      //console.log('swarm is not on');
      this.components[componentName] = component;
      return true;
    } else {
      //console.log('swarm is on');
      await this.vectorDb.create( `idx:${componentName}`, component.schema , {
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
    if (this.WATCH) this.eventEmitter.emit('*', eventData);//system monitoring  
  }
  
  on(eventType, listener) {
    this.eventEmitter.on(eventType, listener);
  }  // Add other methods as needed
}


