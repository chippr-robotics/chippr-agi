import * as dotenv from 'dotenv';
import { EventEmitter } from 'events';
dotenv.config();

export class MessageBus {
  constructor() {
    this.eventEmitter = new EventEmitter();
    if (process.env.MSG_BUS === 'redis') {
        this.publisher = redis.createClient({redisOptions});
        this.subscriber = redis.createClient({redisOptions});
        //receive message from redis
        this.subscriber.on('message', (eventType, listener)=>{
            this.eventEmitter.emit(eventType, listener);
        });
        //send to redis
        this.eventEmitter.on((eventType, eventData) => {
            this.publisher.publish(eventType, eventData);
        });
    } 
    //more buses to come...
  }

  // Proxy methods to the underlying model
  emit(eventType, eventData) {
    this.eventEmitter.emit(eventType, eventData)
    }

  on(eventType, listener) {
    this.eventEmitter.on(eventType, listener);
  }  // Add other methods as needed
}



