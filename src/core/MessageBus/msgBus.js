//import { EventEmitter } from 'events';
import * as pubsub from 'pubsub-js';
import messageSchema from './messageSchema.json' assert { type: 'json' };

export class MessageBus {
  constructor(chipprConfig) {
    //decide if needed
    this.messageSchema = messageSchema;
    switch (chipprConfig.CORE.MSG_BUS)   {
      case'redis'://do not use
        this.publisher = redis.createClient({redisOptions});
        this.subscriber = redis.createClient({redisOptions});
        break;
      default:
        //update in messagebus updates
        this.publisher = pubsub;
        this.subscriber = pubsub;
      } 
    //more buses to come after mvp...
  }

  subscribe(eventType, listener){
    this.subscriber.subscribe(eventType, listener);
  }

  publish(eventType, eventData) {
    let msgData = { ...eventData };
    msgData.timestamp = Math.floor(Date.now() / 1000);
    this.publisher.publish(eventType, eventData);
  }

}



