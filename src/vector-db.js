const redis = require('redis');
const {createClient, SchemaFieldTypes, VectorAlgorithms } = require("redis");
const {createHash} = require('node:crypto');

class VectorDB {
  constructor(name, indexName, redisOptions) {
    this.name = name;
    this.index = 0;
    this.indexName = indexName;
    this.redisClient = redis.createClient(redisOptions);
    this.redisClient.connect();
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
        await this.redisClient.ft.create( 
          `idx:${this.indexName}`,
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
          '$.taskid':{
            type: SchemaFieldTypes.TEXT,
            AS: 'taskid'
          },
          '$.task':{
            type: SchemaFieldTypes.TEXT,
            AS: 'task'
          },
          '$.reward':{
            type: SchemaFieldTypes.NUMERIC,
            AS: 'reward'
          },
          '$.done':{
            type: SchemaFieldTypes.TAG,
            AS: 'done'
          },
          '$.dependencies':{
            type: SchemaFieldTypes.TEXT,
            AS: 'dependencies'
          },
          '$.state':{
            type: SchemaFieldTypes.TEXT,
            AS: 'state'
          },
          '$.action':{
            type: SchemaFieldTypes.TEXT,
            AS: 'action'
          },
          '$.actionProbability':{
            type: SchemaFieldTypes.NUMERIC,
            AS: 'actionProbability'
          },
          '$.nextState':{
            type: SchemaFieldTypes.TEXT,
            AS: 'nextState'
          },
          '$.rewardForAction':{
            type: SchemaFieldTypes.NUMERIC,
            AS: 'rewardForAction'
          }
        },{
          ON: 'JSON',
          PREFIX: this.indexName,
        });  
      } catch (error) {
        console.error(error);
      };
      return true
    }
  }
  
  async save(_task, _embedding) {
    let hashID = this.getHashId(_task.taskid);
    try {
      await this.redisClient.json.set(
        hashID, 
        '$',
        {
          embedding : _embedding,
          taskid : _task.taskid,
          reward : _task.reward, 
          done : _task.done, 
          dependencies : _task.dependencies, 
          state : _task.state,
          action : _task.action, 
          actionProbability : _task.actionProbability,
          nextState : _task.nextState,
          rewardForAction : _task.rewardForAction,
        });
      this.index++;
      return true;
    } catch (error) {
      console.error(error);
    }
  }

  async get(_taskID) {
    try {
      let knn = await this.redisClient.ft.search(
        this.indexName ,
        `(@${_taskID}")`
        );
      console.debug(knn);
      return knn;
    } catch (error) {
      console.error(error);
    }
  }

  async getNeighbors(_embedding) {
    try {
      let knn = await this.redisClient.ft.search(
        `idx:${this.indexName}` ,
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
    let hashID = this.indexName + ":" + hash.read().toString('hex').slice(0,10)
    return hashID
  }
}

module.exports = VectorDB
