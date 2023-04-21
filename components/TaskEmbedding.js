import { CHIPPRAGI } from "../index.js";

import { SchemaFieldTypes, VectorAlgorithms } from "redis";

CHIPPRAGI.registerComponent('TaskEmbedding', {
    schema:{
      '$.entityID': {
        type: SchemaFieldTypes.TEXT,
        AS: 'entityID'
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
    },
       
    init: function (entityId, componentData) {
      // Do something when the component is first attached, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the initial data for the component.
      console.log('started from the bottom now were here!');
    },
  
    update: function (entityId, componentData) {
      // Do something when the component's data is updated, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the updated data for the component.
    },
  
    remove: function (entityId) {
      // Do something when the component or its entity is detached, if needed.
      // entityId is the ID of the entity this component is attached to.
    },
  
    tick: function (entityId, time, timeDelta) {
      // Do something on every scene tick or frame, if needed.
      // entityId is the ID of the entity this component is attached to.
      // time is the current time in milliseconds.
      // timeDelta is the time in milliseconds since the last tick.
    }
  });