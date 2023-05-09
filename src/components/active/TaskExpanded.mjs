import { CHIPPRAGI } from "../../index.js";

import { SchemaFieldTypes } from "redis";

CHIPPRAGI.registerComponent('TaskExpanded', {
    schema: {
      '$.expandedTask': {
          type: SchemaFieldTypes.TEXT,
          AS: 'expandedTask'
      },
      '$.justification': {
          type: SchemaFieldTypes.TAG,
          AS: 'justification'
      },
    },
  
    info: {
      version : "0.1.0",
      license : "APACHE-2.0",
      developer: "CHIPPRBOTS",
      description : "This component is used to display a tasks expanded description",
    },
});