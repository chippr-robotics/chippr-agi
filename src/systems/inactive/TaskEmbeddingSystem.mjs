import { CHIPPRAGI } from "../../../index.js";

CHIPPRAGI.registerSystem('TaskEmbeddingSystem', {
  info: {
    version : "0.1.0",
    license : "APACHE-2.0",
    developer: "CHIPPRBOTS",
    description : "This system creates an embedding for a task description that can be used for next neighbor lookup",
  },

  init: function () {
    CHIPPRAGI.subscribe('UPDATE', (eventData) => {this.update(eventData)});
    CHIPPRAGI.subscribe('REMOVE', (eventData) => {this.remove(eventData)});
    CHIPPRAGI.subscribe('TICK', (eventData) => {this.tick(eventData)});
    CHIPPRAGI.subscribe('SYSTEM', (eventData) => {
      if (eventData.eventType == 'newEntity') {
        setTimeout(async () => {
            this.handleNewEntity(data.payload.data)    
          },
          5000)
        };   
    });
  },

  remove: function () {
    // Do something when the component or its entity is detached, if needed.
  },
  
  //methods go here
  handleNewEntity: async function (data){
      //look at how to do this with db
      let taskDescription = await CHIPPRAGI.getComponentData(data.entityID,'TaskDescription');
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

