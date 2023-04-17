var expect    = require("chai").expect;
var  {VectorDb}  = require('../src');


describe("VectorDB function testing", function() {
    let testAgent = 'testAgent;'
    let redisURL = process.env.REDIS_URL;
    const indexName = 'testDB';
            
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

        describe("HashID testing", function() {
            let testHex = `${indexName}:9f86d08188`;
            let testSecret = 'test';
            let testSecretBad = 'badTestString';
            it("should return a correct hashID given a string", function() {
                let test = vectorDb.getHashId(testSecret);
                expect(test).to.equal(testHex);
            });
            it("should not return a correct hashID given a random string", function() {
                let test = vectorDb.getHashId(testSecretBad);
                expect(test).to.not.equal(testHex);
            });
        });
        
    });
});