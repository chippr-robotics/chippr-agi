/*async getEmbeddings(taskDescription){
    let clean_text = taskDescription.replace("\n", " ")
    //console.log(clean_text);
    let response= await this.langModel.createEmbedding({
        model : "text-embedding-ada-002",
        input : clean_text
    });
    //console.log(response.data.data[0].embedding);
    let floatbuffer = this.float32Buffer(response.data.data[0].embedding);
    let clean = response.data.data[0].embedding;
    return {floatbuffer, clean};
  }
  */