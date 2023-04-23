import { CHIPPRAGI } from "../../../index.js";
import { SchemaFieldTypes } from "redis";

CHIPPRAGI.registerComponent('ObjectiveDescription',{
    schema: {
        '$.entityID': {
            type: SchemaFieldTypes.TEXT,
            AS: 'entityID'
        },
        '$.objective': {
            type: SchemaFieldTypes.TEXT,
            AS: 'objective'
        },
        '$.complete': {
            type: SchemaFieldTypes.TAG,
            AS: 'complete'
        },     
    },

    info:{}
    
});
