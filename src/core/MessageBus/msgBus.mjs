//import { EventEmitter } from 'events';
import PubSub from 'pubsub-js';
import { messageSchema } from './messageSchema.js';

export class MessageBus {
  constructor(chipprConfig) {
    //decide if needed
    this.MessageSchema = messageSchema;
    this.PubSub = PubSub;
    this.sanity = [];
    switch (chipprConfig.MESSAGE_BUS.MESSAGE_BUS_TYPE)   {
      case'redis'://do not use yet
        this.publisher = redis.createClient({redisOptions});
        this.subscriber = redis.createClient({redisOptions});
        break;
      default:
        //update in messagebus updates
        this.publisher = this.PubSub;
        this.subscriber = this.PubSub;
      } 
    if(chipprConfig.MESSAGE_BUS.MESSAGE_BUS_WATCH == true ) {
      this.watcher = (t,m) => { 
        console.log(`*Watcher* New ${t} Message: ${JSON.stringify(m)}`);
        //this.sanity.push(m);
        //console.log(JSON.stringify(this.sanity));
      }; 
      this.PubSub.subscribeAll(this.watcher);         
      
      };
    //more buses to come after mvp...
  }

  subscribe(eventType, listener){
    //console.log(`subscribe ${JSON.parse(this.subscriber)}`);
    this.subscriber.subscribe(eventType, listener);
  }

  publish(eventType, eventData) {
    this.publisher.publish(eventType, eventData);
  }

  systemMessage( _eventType, _entityID, _componentName, _sourceSystem, _data ) {
    let newMessage = { ...this.MessageSchema };
    newMessage.eventType = _eventType;
    newMessage.payload.entityID = _entityID;
    newMessage.payload.componentName = _componentName || null;    
    newMessage.payload.data = _data || {};
    //metadata management
    newMessage.metadata.timestamp = Math.floor(Date.now());
    newMessage.metadata.sourceSystem = _sourceSystem; 
    //if(this.Watch ==true ) console.log(`Sending message system ${JSON.stringify(newMessage)}`);
    this.publish('SYSTEM', [newMessage]);
  }

  updateMessage( _eventType, _entityID, _componentName, _sourceSystem, _data ) {
    console.log(`type: ${_eventType} entityID: ${_entityID} componentName: ${_componentName}, data: ${_data}`);
    let newMessage = { ...this.MessageSchema };
    newMessage.eventType = _eventType;
    newMessage.payload.entityID = _entityID;
    newMessage.payload.componentName = _componentName || null;    
    newMessage.payload.data = _data || {};
    //metadata management
    newMessage.metadata.timestamp = Math.floor(Date.now());
    newMessage.metadata.sourceSystem = _sourceSystem; 
    console.log(`Sending update message ${JSON.stringify(newMessage)}`);
    this.publish('UPDATE', newMessage);
  }
  pubOnce (callback, dependencies) {
    // Calling it first time since there are no dependency
    if (dependencies === undefined) {
      return callback();
    }
  
    // Creating proxy for setters
    return new Proxy(dependencies, {
      set: function (target, key, value) {
        Reflect.set(target, key, value);
        callback();
      },
    });
  };
}



