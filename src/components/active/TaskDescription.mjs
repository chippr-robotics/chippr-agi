import { CHIPPRAGI } from "../../../index.js";

import { SchemaFieldTypes } from "redis";

CHIPPRAGI.registerComponent('TaskDescription', {
    schema: {
      '$.entityID': {
          type: SchemaFieldTypes.TEXT,
          AS: 'entityID'
      },
      '$.task': {
          type: SchemaFieldTypes.TEXT,
          AS: 'task'
      },
      '$.complete': {
          type: SchemaFieldTypes.TAG,
          AS: 'complete'
      },
    //TODO ADD SCHEMA VERSIONING     
  },
  
  info: {}
});