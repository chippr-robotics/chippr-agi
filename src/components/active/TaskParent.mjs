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
  
  info:{}
});