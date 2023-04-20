import { CHIPPRAGI } from "../index.js";

CHIPPRAGI.registerSystem('TaskEmbeddingSystem', {
    init: function (_eventEmitter) {
        _eventEmitter.on('newEntity', (data) => {
          this.getEmbeddings(data);
        });
    },
  
    update: function (entityId, componentData) {
      // Do something when the component's data is updated, if needed.
      // entityId is the ID of the entity this component is attached to.
      // componentData contains the updated data for the component.
    },
  
    remove: function () {
      // Do something when the component or its entity is detached, if needed.
      clearInterval();
    },
  
    tick: function (entityId, time, timeDelta) {
      // Do something on every scene tick or frame, if needed.
      // entityId is the ID of the entity this component is attached to.
      // time is the current time in milliseconds.
      // timeDelta is the time in milliseconds since the last tick.
    },
    
    //methods go here
    async getEmbeddings(data){
        let taskDescription = CHIPPRAGI.entities[data.entityID]['TaskDescription'].task;
        let clean_text = taskDescription.replace("\n", " ")
        //console.log(clean_text);
        let response= await CHIPPRAGI.langModel.createEmbedding({
            model : "text-embedding-ada-002",
            input : clean_text
        });
        //console.log(response.data.data[0].embedding);
        let floatbuffer = this.float32Buffer(response.data.data[0].embedding);
        let clean = response.data.data[0].embedding;
        await CHIPPRAGI.vectorDb.save(
            'TaskEmbedding', 
            data.entityID, 
            {
                taskid: data.entityID,
                clean: clean,
                floatbuffer: floatbuffer,
            });
        //keep until everything is moved to db
        CHIPPRAGI.addComponent(data.entityID, 'TaskEmbedding', {
            taskid: data.entityID,
            clean: clean,
            floatbuffer: floatbuffer,
        })
    },
    
    float32Buffer(arr) {
        return Buffer.from(new Float32Array(arr).buffer)
      }
  
  });

