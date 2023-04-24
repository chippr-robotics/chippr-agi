//import { EventEmitter } from 'events';
import PubSub from 'pubsub-js';
import messageSchema from './messageSchema.json' assert { type: 'json' };

export class MessageBus {
  constructor(chipprConfig) {
    //decide if needed
    this.MessageSchema = messageSchema;
    switch (chipprConfig.CORE.MSG_BUS)   {
      case'redis'://do not use yet
        this.publisher = redis.createClient({redisOptions});
        this.subscriber = redis.createClient({redisOptions});
        break;
      default:
        //update in messagebus updates
        this.publisher = PubSub;
        this.subscriber = PubSub;
      } 
    //more buses to come after mvp...
  }

  subscribe(eventType, listener){
    //console.log(`subscribe ${JSON.parse(this.subscriber)}`);
    this.subscriber.subscribe(eventType, listener);
  }

  publish(eventType, eventData) {
    let msgData = { ...eventData };
    msgData.timestamp = Math.floor(Date.now());
    this.publisher.publish(eventType, eventData);
  }

}



