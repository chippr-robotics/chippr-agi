import { EventEmitter } from 'events';

export class MessageBus {
  constructor(messageBusConfig) {
    //decide if needed
    this.eventEmitter = new EventEmitter();
    switch (messageBusConfig.MESSAGE_BUS_TYPE)   {
      case'mysql':
      break;
      default:
        
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



