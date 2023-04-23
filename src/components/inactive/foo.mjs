import { CHIPPRAGI } from "../../index.js";
import { SchemaFieldTypes, VectorAlgorithms } from "redis";


CHIPPRAGI.registerComponent('foo', {
  //redis schema for the component  
  schema: {
    '$.entityID': {
      type: SchemaFieldTypes.TEXT,
      AS: 'entityID'
    },
  },

  info:{}
});