export class NoOpClient {
       constructor(chipprConfig){
              this.tests =
              {
                     data:{
                            choices: [{
                                   text: 'TESTING',
                            }],
                            data: [{
                                   embedding: 'TESTING',
                            }],
                     },
              };
       }

       createCompletion() { return  Promise.resolve(this.tests)};
       createEmbedding() { return  Promise.resolve(this.tests)};
       createChat(){return  Promise.resolve(this.tests)};
       createCodex(){return  Promise.resolve(this.tests)};
       createEdit(){return  Promise.resolve(this.tests)};
       createImage(){return  Promise.resolve(this.tests)};
       createAudio(){return  Promise.resolve(this.tests)};
       // Add any other methods that you need to mock during testing    
};