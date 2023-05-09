var expect    = require("chai").expect;
var  { VectorDb }  = require('../../core');
require('dotenv').config();


describe("VectorDB function testing", function() {
    let redisURL = process.env.REDIS_URL;
    let indexName = process.env.INDEX_NAME;
    const testTask = require('../testTask.json');
    
    describe("Basic class testing", function() {
      it("should allow new vectorDB given agentID and redis url", function() {
        //this step should create an new index as well for the index name. 
        let test = new VectorDb( indexName, {url: redisURL} ); // Initialize vector database
        expect(test.indexName).to.equal(indexName);
        expect(test.redisClient).to.not.be.undefined;
        test.redisClient.quit();
      });
    });
    describe("Class functions", function() {
        let vectorDb;
        beforeEach(() => {
            //this step should create an new index as well for the index name. 
            vectorDb = new VectorDb( indexName, {url: redisURL} ); // Initialize vector database         
        });
        //close the db connection
        afterEach(async () => await vectorDb.redisClient.disconnect());
        
        describe("Create DB index", function() {
            it("should create an index if the index does not exist", async function() {
                let list = await vectorDb.redisClient.ft._list();
                //drop index if it exists already
                if(list.indexOf(indexName) > -1) await vectorDb.redisClient.ft.DROPINDEX( indexName, 'DD' );             
                let test = await vectorDb.create();
                list = await vectorDb.redisClient.ft._list();
                let test2 = list.indexOf(indexName) > -1;
                expect(test).to.equal(true);
                expect(test2).to.equal(true);
            });
            it("should not create an index if the index does exist", async function() {
                //get a list of indexes
                let list = await vectorDb.redisClient.ft._list();
                //create index if it doesnt exist already
                if(!(list.indexOf(indexName) > -1)) await vectorDb.create();
                let test = await vectorDb.create();
                let test2 = list.indexOf(indexName) > -1;
                expect(test).to.equal(false);
                expect(test2).to.equal(true);
            })
        });
        describe("Write/Read testing ", function(){
            it("should write to the db ", async function() {
                let test = await vectorDb.save( 'TEST', testTask.taskid, testTask);
                expect(test).to.equal(true);
            });
            it("should read from the db ", async function() {
                let task = await vectorDb.get('TEST', testTask.taskid);
                expect(task.taskid).to.equal(testTask.taskid);
            });
        });       
    });
});