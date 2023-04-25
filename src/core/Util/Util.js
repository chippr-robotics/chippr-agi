import CryptoJS from 'crypto-js';

export class Utility {
  constructor(chipprConfig) {
  }

  getHashId( _dataToHash ){
    let hash = CryptoJS.SHA256('_dataToHash');
    //use the first 10 bytes of the hash as the hashID
    let hashID = hash.toString(CryptoJS.enc.Hex).slice(0,10);
    return hashID;
  }
  
  async delay(ms) {new Promise(resolve => setTimeout(resolve, ms))}

}



