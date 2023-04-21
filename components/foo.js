import { CHIPPRAGI } from "../index.js";

CHIPPRAGI.registerComponent('foo', {
  //redis schema for the component  
  schema: {
    '$.entityID': {
      type: SchemaFieldTypes.TEXT,
      AS: 'entityID'
    },
  },

  init: function () {
    // Do something when component first attached.
  },
  
  update: function () {
    // Do something when component's data is updated.
  },
  
  remove: function () {
    // Do something when the component or its entity is detached.
  },
  
  tick: function (time, timeDelta) {
    // Do something on every scene tick or frame.
  }
});