import * as dotenv from 'dotenv';
dotenv.config();
 
import  'fs';
import { VectorDB } from './Vector-db/vector-db.js'
import { LanguageModel } from './LangModel/langModel.js';
import { MessageBus } from './MessageBus/msgBus.js';
import { Utility } from './Util/Util.js';
import { CHIPPRAGI } from '../index.js';

export class ChipprAGI {
  constructor(chipprConfig) {
    this.SWARM_MODE = chipprConfig.CORE.SWARM_MODE;
    this.DASHBOARD = chipprConfig.CORE.DASHBOARD;
    this.WATCH = chipprConfig.CORE.WATCH;
    this.TESTING = chipprConfig.TESTING;
    this.Util = new Utility(chipprConfig);
    this.MessageBus = new MessageBus(chipprConfig);
    this.LangModel = new LanguageModel(chipprConfig);
    this.vectorDb = new VectorDB(chipprConfig); // Initialize vector database
    this.entities = {};
    this.components = {};
    this.systems ={};
    this.init();
  }

  async init() {
    if(this.TESTING != true){
      //this.langModel.init();
      //this.vectorDb.init();
      //this.eventEmitter.init();
    };
    //load the core systems
    console.log('|-- Welcome to Chippr AGI! --|');
    //console.log('Loading core systems');
    await import ('../systems/active/CoreSystemLoader.mjs');
    this.systems['CoreSystemLoader'].init();//import ('../systems/active/.mjs');
  }
  async createEntity(_entityID) {
    //console.log('creating entity');
    if(this.SWARM_MODE != true){
      //console.log('creating entity');
      this.entities[_entityID] = {};
    } else {
      await this.vectorDb.save( `idx:entities:${_entityID}`, '$',  {});
    }
  }

  async getAllEntities(componentName){
    return await this.vectorDb.query(`idx:${componentName}:*`);
  }

  addComponent(entityId, componentName, componentData) {
    //check if we store components in the db or not
    if(this.SWARM_MODE != true){
      this.entities[entityId][componentName] = componentData;
      return true;
    } else {
      this.vectorDb.save( `idx:${componentName}:${entityId}`, '$',  componentData);
    }
  }

  getComponentData(entityId, componentName) {
    //check if we store components in the db or not
    try {
      if(this.SWARM_MODE != true){
        return this.entities[entityId][componentName];
      } else {
        return this.vectorDb.get(`idx:${componentName}:${entityId}`);
      }  
    } catch (error) {
     console.log(`CHIPPRAGI : getcomponentdata error: ${error}`);
     return null; 
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
      //save for local use
      this.components[componentName] = component;
    } 
  }

  registerSystem(systemName, system) {
    //console.log(systemName);
    //all systems are local so store it at its name
    this.systems[systemName]= system;
  }

  subscribe(eventType, listener){
    this.MessageBus.subscribe(eventType, listener);
  }

  publish(eventType, eventData) {
    this.MessageBus.publish(eventType, eventData);
  }
}


