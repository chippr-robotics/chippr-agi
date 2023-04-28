import CryptoJS from 'crypto-js';

export class Utility {
  constructor(chipprConfig) {
  }

  getHashId( _dataToHash ){
    //console.log(`hashing date: ${_dataToHash}`);
    let hash = CryptoJS.SHA256(_dataToHash);
    //use the first 10 bytes of the hash as the hashID
    let hashID = hash.toString(CryptoJS.enc.Hex).slice(0,10);
    //console.log(`returning hash: ${hashID}`)
    return hashID;
  }
  
  async delay(ms) {new Promise(resolve => setTimeout(resolve, ms))}
  
  
  watcher (msgBus, logger){
      //cant be configured until after init
      let watch = (m) => { 
        logger.info(`*WatcherService* : ${m}`);
      }; 
      msgBus.subscriber.subscribe('SYSTEM', watch); 
      msgBus.subscriber.subscribe('UPDATE', watch);
      msgBus.subscriber.subscribe('REMOVE', watch);
    };
    
  useEffect (callback, dependencies) {
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



