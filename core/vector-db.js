import * as redis from 'redis';
import {createClient, SchemaFieldTypes, VectorAlgorithms } from "redis";

export class VectorDB {
  constructor( indexName, redisOptions) {
    this.indexName = indexName;
    this.client;
    if (!process.env.TESTING) {
      this.client = redis.createClient({redisOptions});
      this.create();
      client.on('error', (error) => { 
        console.error('Redis error:', error);
      });
    } else {
      this.client = null;
      this.publisher = this.createNoOpClient();
      this.subscriber = this.createNoOpClient();
    }
  }

  async create() {
    //get a list of index in the DB
    let list = await this.redisClient.ft._list();
    // escape if the list contains the current index
    if(list.indexOf(this.indexName) > -1){
      return false;
    } else {
    //create a new index if none exists
      try {
        let test = await this.redisClient.ft.create( 
          this.indexName,
          {
          '$.taskId': {
              type: SchemaFieldTypes.TEXT,
              AS: 'taskid'
            },
          '$.clean' : {
            type: SchemaFieldTypes.VECTOR,
            AS: 'vector',
            ALGORITHM: VectorAlgorithms.HNSW,
            COUNT: '7',
            TYPE: 'FLOAT32',
            DIM: '1536',
            DISTANCE_METRIC: 'COSINE'
          }, 
          '$.floatbuffer' : {
            type: SchemaFieldTypes.VECTOR,
            AS: 'vector',
            ALGORITHM: VectorAlgorithms.HNSW,
            COUNT: '7',
            TYPE: 'FLOAT32',
            DIM: '1536',
            DISTANCE_METRIC: 'COSINE'
          }, 
        },{
          ON: 'JSON',
          PREFIX: 'vectorDB:TASK:',
        });  
        console.log(test);
      } catch (error) {
        console.error(error);
      };
      return true
    }
  }
  
  async save(_componentName, _taskID, _data) {
    //console.log('saving task');
    try {
      await this.redisClient.json.set(
        this.indexName + ":" + _componentName +":" + _taskID, 
        '$',
        _data,
        );
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

  async get(_componentName, _taskID) {
    try {
      let task = await this.redisClient.json.get( this.indexName + ":" + _componentName +":" + _taskID );
      return task;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
  //@dev done is a bool to fetch either tasks that are done or not
  async getNeighbors(_embedding, done) {
    console.log('getting neighbors')
    //console.log(_embedding)
    try {
      let knn = await this.redisClient.ft.search(
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
  
  createNoOpClient() {
    return {
      on: () => {},
      publish: () => {},
      // Add any other methods that you need to mock during testing
    };
  }

}


