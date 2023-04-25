//import { EventEmitter } from 'events';
import PubSub from 'pubsub-js';
import messageSchema from './messageSchema.json';

export class MessageBus {
  constructor(chipprConfig) {
    //decide if needed
    this.MessageSchema = messageSchema;
    this.Watch = chipprConfig.MESSAGE_BUS.MESSAGE_BUS_WATCH;
    switch (chipprConfig.MESSAGE_BUS.MESSAGE_BUS_TYPE)   {
      case'redis'://do not use yet
        this.publisher = redis.createClient({redisOptions});
        this.subscriber = redis.createClient({redisOptions});
        break;
      default:
        //update in messagebus updates
        this.publisher = PubSub;
        this.subscriber = PubSub;
      } 
    this.watcher =  (this.Watch ==true ) ? this.subscriber.subscribe('SYSTEM', (t,m)=>{console.log(`*Watcher* New Message: ${JSON.stringify(m)}`)}) : null;
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
    //if(this.Watch ==true ) console.log(`Sending message ${JSON.stringify(newMessage)}`);
    this.publisher.publishSync('SYSTEM', [newMessage]);
  }
}



