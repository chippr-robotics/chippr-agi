import { CHIPPRAGI } from "../../index.js";
import { SchemaFieldTypes } from "redis";

CHIPPRAGI.registerComponent('ObjectiveDescription',{
    schema: {
        '$.objective': {
            type: SchemaFieldTypes.TEXT,
            AS: 'objective'
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
        description : "This component shows the objective description of an entity.",
      },    
});
