const redis = require('redis');
const {createClient, SchemaFieldTypes, VectorAlgorithms } = require("redis");
const {createHash} = require('node:crypto');

class VectorDB {
  constructor(name, indexName, redisOptions) {
    this.name = name;
    this.indexName = indexName;
    this.redisClient = redis.createClient(redisOptions);
    this.redisClient.connect();
    this.create();
    this.redisClient.on('error', (err) => console.log('Redis Client Error', err));
  }

  async create() {
    //get a list of index in the DB
    let list = await this.redisClient.ft._list();
    // escape if the list contains the current index
    if(list.indexOf(`idx:${this.indexName}`) > -1){
      return false;
    } else {
    //create a new index if none exists
      try {
        let test = await this.redisClient.ft.create( 
          this.indexName,
          {
          '$.embedding' : {
            type: SchemaFieldTypes.VECTOR,
            AS: 'vector',
            ALGORITHM: VectorAlgorithms.HNSW,
            COUNT: '7',
            TYPE: 'FLOAT32',
            DIM: '1536',
            DISTANCE_METRIC: 'COSINE'
          }, 
          '$.taskid': {
            type: SchemaFieldTypes.TEXT,
            AS: 'taskid'
          },
          '$.task':{
            type: SchemaFieldTypes.TEXT,
            AS: 'task'
          },
          '$.reward' :{
            type: SchemaFieldTypes.NUMERIC,
            AS: 'reward'
          },
          '$.done.*':{
            type: SchemaFieldTypes.TAG,
            AS: 'done'
          },
          '$.dependencies.*' :{
            type: SchemaFieldTypes.TAG,
            AS: 'dependencies'
          },
          '$.action' :{
            type: SchemaFieldTypes.TEXT,
            AS: 'action'
          },
          '$.actionProbability' :{
            type: SchemaFieldTypes.NUMERIC,
            AS: 'actionProbability'
          },
          '$.rewardForAction' :{
            type: SchemaFieldTypes.NUMERIC,
            AS: 'rewardForAction'
          }
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
  
  async save(_task, _embedding) {
    console.log('saving task');
    let hashID = this.getHashId(_task.task);
    try {
      await this.redisClient.json.set(
        this.indexName + ":TASK:" + hashID, 
        '$',
        {
          'embedding' : _embedding,
          'taskid' : hashID,
          'task': _task.task,
          'reward' : _task.reward, 
          'done' : _task.done, 
          'dependencies' : _task.dependencies, 
          'action' : _task.action, 
          'actionProbability' : _task.actionProbability,
          'rewardForAction' : _task.rewardForAction,
        });
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

  async get(_taskID) {
    try {
      let task = await this.redisClient.json.get( _taskID );
      return task;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async getNeighbors(_embedding) {
    console.log('getting neighbors')
    //console.log(_embedding)
    try {
      let knn = await this.redisClient.ft.search(
        this.indexName ,
        `*=>[KNN 4 @vector $BLOB AS dist]`,{
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

  getHashId(_input){
    //create a hash
    let hash =  createHash('sha256');
    hash.write(_input);
    hash.end();
    //use the first 10 bytes as id
    let hashID = hash.read().toString('hex').slice(0,10)
    return hashID
  }
}

module.exports = VectorDB
