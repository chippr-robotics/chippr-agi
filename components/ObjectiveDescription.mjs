import { CHIPPRAGI } from "../index.js";
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

    init: function (entityId, componentData) {
        // Do something when the component is first attached, if needed.
        // entityId is the ID of the entity this component is attached to.
        // componentData contains the initial data for the component.
    },

    update: function (entityId, componentData) {
     // Do something when the component's data is updated, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the updated data for the component.
    },

    remove: function (entityId) {
        // Do something when the component or its entity is detached, if needed.
        // entityId is the ID of the entity this component is attached to.
    },

    tick: function (entityId, time, timeDelta) {
    // Do something on every scene tick or frame, if needed.
    // entityId is the ID of the entity this component is attached to.
    // time is the current time in milliseconds.
    // timeDelta is the time in milliseconds since the last tick.
     }
});
