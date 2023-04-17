var expect    = require("chai").expect;
var  {VectorDb}  = require('../src');


describe("VectorDB function testing", function() {
    let testAgent = 'testAgent;'
    let redisURL = process.env.REDIS_URL;
    const indexName = 'testDB';
    const testTask = require('./testTask.json');

            
    describe("Basic class testing", function() {
      it("should allow new vectorDB given agentID and redis url", function() {
        let vectorDb = new VectorDb( testAgent, indexName, {url: redisURL} ); // Initialize vector database
          
        expect(vectorDb.name).to.equal(testAgent);
        expect(vectorDb.index).to.equal(0);
        expect(vectorDb.indexName).to.equal(indexName);
        vectorDb.redisClient.quit();
      });
    });
    describe("Class functions", function() {
        let vectorDb;
        beforeEach(() => {
            vectorDb = new VectorDb( testAgent, indexName, {url: redisURL} ); // Initialize vector database
        });
        //close the db connection
        this.afterEach(async () => await vectorDb.redisClient.quit());
        
        describe("Create DB index", function() {
            it("should create an index if the index does not exist", async function() {
                let list = await vectorDb.redisClient.ft._list();
                //drop index if it exists already
                if(list.indexOf(`idx:${indexName}`) > -1) await vectorDb.redisClient.ft.DROPINDEX( `idx:${indexName}`, 'DD' );             
                let test = await vectorDb.create();
                list = await vectorDb.redisClient.ft._list();
                let test2 = list.indexOf(`idx:${indexName}`) > -1;
                expect(test).to.equal(true);
                expect(test2).to.equal(true);
            });
            it("should not create an index if the index does exist", async function() {
                //get a list of indexes
                let list = await vectorDb.redisClient.ft._list();
                //create index if it doesnt exist already
                if(!(list.indexOf(`idx:${indexName}`) > -1)) await vectorDb.create();
                let test = await vectorDb.create();
                let test2 = list.indexOf(`idx:${indexName}`) > -1;
                expect(test).to.equal(false);
                expect(test2).to.equal(true);
            })
        });
        describe("Write/Read testing ", function(){
            let embedding =  Buffer.alloc(1536);
            it("should write to the db ", async function() {
                let test = await vectorDb.save(testTask, embedding);
                expect(test).to.equal(true);
            });
            it("should read from the db ", async function() {
                let task = await vectorDb.get(testTask.taskid);
                console.log(task);
                expect(task.taskid).to.equal(testTask.taskid);
            });
        });
        describe("HashID testing", function() {
            it("should return a correct hashID given a string", function() {
                let test = vectorDb.getHashId(testTask.task);
                expect(test).to.equal(testTask.taskid);
            });
            it("should not return a correct hashID given a random string", function() {
                let test = vectorDb.getHashId('testBad');
                expect(test).to.not.equal(testTask.taskid);
            });
        });
        
    });
});