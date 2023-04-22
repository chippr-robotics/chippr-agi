import { CHIPPRAGI } from "../../../index.js";

CHIPPRAGI.registerSystem('TaskEmbeddingSystem', {
  info: {
    version : "",
    license : "",
    developer: "",
    description : "This system creates an embedding for a task description that can be used for next neighbor lookup",
  },

  init: function (_eventEmitter) {
        _eventEmitter.on('newEntity', (data) => {
          this.handleNewEntity(data);
        });
  },

  remove: function () {
    // Do something when the component or its entity is detached, if needed.
    this.CHIPPRAGI.eventBus.off('newEntity', this.handleNewEntity);
  },
  
  //methods go here
  handleNewEntity: async function (data){
      //look at how to do this with db
      let taskDescription = await CHIPPRAGI.getComponent(data.entityID,'TaskDescription');
      console.log(taskDescription);
      let clean_text = taskDescription.task.replace("\n", " ")
      //console.log(clean_text);
      let response= await CHIPPRAGI.langModel.createEmbedding({
          model : "text-embedding-ada-002",
          input : clean_text
      });
      //console.log(response.data.data[0].embedding);
      let floatbuffer = this.float32Buffer(response.data.data[0].embedding);
        let clean = response.data.data[0].embedding;
        //keep until everything is moved to db
        CHIPPRAGI.addComponent(data.entityID, 'TaskEmbedding', {
          entityID: data.entityID,
          clean: clean,
          floatbuffer: floatbuffer,
        })
    },
    
    float32Buffer(arr) {
        return Buffer.from(new Float32Array(arr).buffer)
      }
  
  });

