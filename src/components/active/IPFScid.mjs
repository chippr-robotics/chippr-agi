import { CHIPPRAGI } from "../../index.js";
import { SchemaFieldTypes } from "redis";

CHIPPRAGI.registerComponent('IPFScid', {
  schema:{
    '$.fileCID': {
      type: SchemaFieldTypes.TEXT,
      AS: 'cid'
    }, 
  },
  
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    multi: true,
    description : "This component stores a files cid on the ipfs network",
  },
});