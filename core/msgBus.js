import { EventEmitter } from 'events';

export class MessageBus {
  constructor(chipprConfig) {
    //decide if needed
    this.eventEmitter = new EventEmitter();
    switch (chipprConfig.CORE.MSG_BUS)   {
      case'redis':
        this.publisher = redis.createClient({redisOptions});
        this.subscriber = redis.createClient({redisOptions});
        //receive message from redis
        this.subscriber.on('message', (eventType, listener)=>{
        this.eventEmitter.emit(eventType, listener);
      break
      default:
        this.eventEmitter.on((eventType, eventData) => {
        this.publisher.publish(eventType, eventData);
        })
    } 
    //more buses to come after mvp...
  }

  // Proxy methods to the underlying model
  emit(eventType, eventData) {
    this.eventEmitter.emit(eventType, eventData)
    }

  on(eventType, listener) {
    this.eventEmitter.on(eventType, listener);
  }  // Add other methods as needed
}



