import { CHIPPRAGI } from "../../../index.js";

import { SchemaFieldTypes, VectorAlgorithms } from "redis";

CHIPPRAGI.registerComponent('TaskEmbedding', {
    schema:{
      '$.clean' : {
        type: SchemaFieldTypes.VECTOR,
        AS: 'clean',
        ALGORITHM: VectorAlgorithms.HNSW,
        COUNT: '7',
        TYPE: 'FLOAT32',
        DIM: '1536',
        DISTANCE_METRIC: 'COSINE'
      }, 
      '$.floatbuffer' : {
        type: SchemaFieldTypes.VECTOR,
        AS: 'floatbuffer',
        ALGORITHM: VectorAlgorithms.HNSW,
        COUNT: '7',
        TYPE: 'FLOAT32',
        DIM: '1536',
        DISTANCE_METRIC: 'COSINE'
      }, 
    },
       
    info: {
      version : "0.1.0",
      license : "APACHE-2.0",
      developer: "CHIPPRBOTS",
      description : "This component shows the embedding of a task",
    },
  });