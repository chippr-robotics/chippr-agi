import { CHIPPRAGI } from "../../../index.js";
import { SchemaFieldTypes } from "redis";

CHIPPRAGI.registerComponent('TaskParent', {
  schema:{
    '$.entityID': {
      type: SchemaFieldTypes.TEXT,
      AS: 'entityid'
    },
    '$.parentID': {
      type: SchemaFieldTypes.TEXT,
      AS: 'parentID'
    }, 
  },
  
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This component shows the parent of an entity .",
  },
});