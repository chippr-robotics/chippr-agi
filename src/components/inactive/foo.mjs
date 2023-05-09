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

  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This component shows an example.",
  },
});