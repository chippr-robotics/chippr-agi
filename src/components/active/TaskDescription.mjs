import { CHIPPRAGI } from "../../../index.js";

import { SchemaFieldTypes } from "redis";

CHIPPRAGI.registerComponent('TaskDescription', {
    schema: {
      '$.task': {
          type: SchemaFieldTypes.TEXT,
          AS: 'task'
      },
      '$.complete': {
          type: SchemaFieldTypes.TAG,
          AS: 'complete'
      },
    },
  
    info: {
      version : "0.1.0",
      license : "APACHE-2.0",
      developer: "CHIPPRBOTS",
      description : "This component is used to display a task description",
    },
});