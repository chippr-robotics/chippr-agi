//import { EventEmitter } from 'events';
import { createHash } from 'node:crypto';

export class Utility {
  constructor(chipprConfig) {
  }

  getHashId( _dataToHash ){
    //create a hash
    let hash =  createHash('sha256');
    hash.write(_dataToHash);
    hash.end();
    //use the first 10 bytes of the hash as the hashID
    let hashID = hash.read().toString('hex').slice(0,10);
    return hashID;
  }
  
  async delay(ms) {new Promise(resolve => setTimeout(resolve, ms))}

}



