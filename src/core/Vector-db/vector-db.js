import * as redis from 'redis';


export class VectorDB {
  constructor( chipprConfig ) {
    if (chipprConfig.TESTING != true) {
      switch (chipprConfig.VECTORDB.VECTORDB_TYPE) {
        case 'redis':
          this.client = redis.createClient({url : `redis://${chipprConfig.VECTORDB.VECTORDB_HOST}:${chipprConfig.VECTORDB.VECTORDB_PORT}`});
          this.client.connect();
          this.client.on('error', (error) => { 
            console.error('Redis error:', error);
          });
          break;

        default:
          this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  async create(index, schema, options) {
    //get a list of index in the DB
    //console.log(this.client);
    let list = await this.client.ft._list();
    // escape if the index exists
    //console.log(index);
    if(list.indexOf(index) > -1){
      return false;
    } else {
    //create a new index if none exists
      try {
        //console.log(this.client);
        await this.client.ft.create(index, schema, options);  
      //console.log(createIndex);
      } catch (error) {
        console.error(error);
      };
      
    }
  }
  
  async save(_index, _string, _data) {
    //console.log('saving task');
    try {
      //save to the db
      await this.client.json.set(_index, _string, _data);
      return true;
    } catch (e) {
      if (e.message === 'Index already exists') {
        console.log('Index exists already, skipped creation.');
      } else {
        // Something went wrong, perhaps RediSearch isn't installed...
        console.error(e);
        process.exit(1);
      }
    }
  }

  async get(_index) {
    try {
      let task = await this.client.json.get(_index);
      return task;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
  //@dev done is a bool to fetch either tasks that are done or not
  async getNeighbors(_embedding, done) {
    //console.log('getting neighbors')
    //console.log(_embedding)
    try {
      let knn = await this.client.ft.search(
        this.indexName ,
        `@done:{${done}}=>[KNN 4 @vector $BLOB AS dist]`,{
          PARAMS: {
            BLOB: _embedding 
          },
          SORTBY: 'dist',
          DIALECT: 2,
          RETURN: ['dist']
        });
      //console.debug(knn);
      return knn;
    } catch (error) {
      console.error(error);
    }
  }
  
  async query(componentIndex){
    try {
      let task = await this.client.KEYS(componentIndex);
      return task;
    } catch (error) {
      console.error(error);
    }
  }

  createNoOpClient() {
    return {
      on: () => {},
      publish: () => {},
      ft : {
        search: () => {},
        create: () => {},
      },
      json:{
        get: ()=>{},
        set: ()=>{},
      },
      // Add any other methods that you need to mock during testing
    };
  }

}


