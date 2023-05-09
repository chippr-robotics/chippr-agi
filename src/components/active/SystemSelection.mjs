import { CHIPPRAGI } from "../../index.js";
import { SchemaFieldTypes } from "redis";

CHIPPRAGI.registerComponent('SystemSelection', {
  schema:{
    '$.recommendedSystem': {
      type: SchemaFieldTypes.TEXT,
      AS: 'recommendedSystem'
    }, 
  },
  
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This component shows whic system is recommend next",
  },
});