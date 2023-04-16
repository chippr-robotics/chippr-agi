const redis = require('redis');
const {createClient, SchemaFieldTypes, VectorAlgorithms } = require("redis");
const { Buffer } = require('buffer');

class VectorDB {
  constructor(name, redisOptions) {
    this.name = name;
    this.index = 0;
    this.indexName = 'idx:taskDB';
    this.redisClient = redis.createClient(redisOptions);
    this.redisClient.connect();
    this.redisClient.on('error', (err) => console.log('Redis Client Error', err));
  }

  async create() {
    try {
      await this.redisClient.ft.create( this.indexName,{
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
      },{
        ON: 'JSON',
        PREFIX: 'taskDB'
      });  
    } catch (error) {
      console.error(error);
    };
  }
  
  async save(_taskId, _embedding) {
    try {
      this.redisClient.json.set(
        'taskDB:'+ this.index, 
        '$',
        {
          embedding : _embedding,
          taskid : _taskId
        });
      this.index++;
    } catch (error) {
      console.error(error);
    }
  }

  async getNeighbors(_taskID) {
    try {
      let knn = await this.redisClient.ft.search(
        this.indexName ,
        '(@taskid:'+_taskID+')=>[KNN 4 @vector $BLOB AS dist]',{
          PARAMS: {
            BLOB: Buffer.alloc(1536 * 4)
          },
          SORTBY: 'dist',
          DIALECT: 2,
          RETURN: ['dist']
        });
      console.debug(knn);
      return knn;
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = VectorDB
