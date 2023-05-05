import CryptoJS from 'crypto-js';
import * as ipfs from 'ipfs';

export class Utility {
  constructor(chipprConfig) {
    this.node;  
    this.init();
  }

  async init() {
    this.node = await ipfs.create();
    //console.log(this.node)
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
        logger.info( {log: JSON.parse(m), system: 'WatcherService' });
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

  async storeData( data ){
    // takes a data object in and returns a cid string
    const results = await this.node.add(data)
    //do something with results maybe
    return results;
  }

  async getData( cid ){
    for await (const buf of this.node.get(cid)) {
      return buf;
    }
  }

  async readData( cid ){
    for await (const ary of this.node.cat(cid)) {
      return ary;
    }
  }
}



