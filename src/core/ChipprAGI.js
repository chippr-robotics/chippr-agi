import * as dotenv from 'dotenv';
dotenv.config();
 
import  'fs';

//add the core systems
//import { CHIPPRAGI } from '../index.js';
import { LanguageModel } from './LangModel/langModel.js';
import { Logger } from './Logger/logger.js';
import { MessageBus } from './MessageBus/msgBus.mjs';
import { Utility } from './Util/Util.js';
import { VectorDB } from './Vector-db/vector-db.js'


export class ChipprAGI {
  constructor(chipprConfig) {
    this.SWARM_MODE = chipprConfig.CORE.SWARM_MODE;
    this.DASHBOARD = chipprConfig.CORE.DASHBOARD;
    this.TESTING = chipprConfig.TESTING;
    this.LangModel = new LanguageModel(chipprConfig);
    this.Logger = new Logger(chipprConfig);
    this.MessageBus = new MessageBus(chipprConfig);
    this.Util = new Utility(chipprConfig);
    this.vectorDb = new VectorDB(chipprConfig); // Initialize vector database
    //local cache
    this.entities = {};
    this.components = {};
    this.systems ={};
    if(chipprConfig.MESSAGE_BUS.MESSAGE_BUS_WATCH == true) this.Util.watcher(this.MessageBus, this.Logger, chipprConfig); 
    this.init();
  }

  async init() {
    if(this.TESTING != true){
      //this.langModel.init();
      //this.vectorDb.init();
      //this.eventEmitter.init();
    };
    //load the core systems
    this.Logger.debug({ system : 'ChipprAGI', log : 'Loading core systems'});
    await import ('../systems/active/CoreSystemLoader.mjs');
    this.systems['CoreSystemLoader'].init();//import ('../systems/active/.mjs');
  }
  async createEntity(_entityID) {
    this.Logger.debug( 'creating entity');
    if(this.SWARM_MODE != true){
      this.Logger.debug('creating entity in swarm mode');
      this.entities[_entityID] = {};
    } else {
      await this.vectorDb.save( `idx:entities:${_entityID}`, '$',  {});
    }
  }

  async getAllEntities(){
    return await this.vectorDb.query(`idx:entities:*`);
  }

  async getEntitiesByComponent(componentName){
    return await this.vectorDb.query(`idx:${componentName}:*`);
  }

  addComponent

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
      this.Logger.log('error',`CHIPPRAGI : getcomponentdata error: ${error}`);
     return null; 
    }
  }

  setComponentData(entityId, componentName, componentData) {
    try {
      if(this.SWARM_MODE != true){
        this.entities[entityId][componentName] = componentData;
        return true;
      } else {
        this.vectorDb.save( `idx:${componentName}:${entityId}`, '$',  componentData);
        return true;
      }  
    } catch (error) {
      this.Logger.log('error',`CHIPPRAGI : setcomponentdata error: ${error}`);
     return false; 
    }
  } 

  async registerComponent(componentName, component) {
    this.Logger.debug(`swarmmode:${this.SWARM_MODE}`);
    this.Logger.debug( componentName);
    if(this.SWARM_MODE != true){
      this.Logger.debug('swarm is not really on');
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


