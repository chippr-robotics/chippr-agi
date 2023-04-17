var expect    = require("chai").expect;
var  {VectorDb}  = require('../src');


describe("VectorDB function testing", function() {
    describe("Basic class testing", function() {
      it("should allow new vectorDB given agentID and redis url", function() {
        let testAgent = 'testAgent;'
        let redisURL = process.env.REDIS_URL;
        let vectorDb = new VectorDb( testAgent, {url: redisURL} ); // Initialize vector database
          
        expect(vectorDb.name).to.equal(testAgent);
        expect(vectorDb.index).to.equal(0);
        expect(vectorDb.indexName).to.equal('idx:vectorDB');
        vectorDb.redisClient.quit();
      });
    });
    describe("Class functions", function() {
        let vectorDb;
        beforeEach(() => {
            let testAgent = 'testAgent;'
            let redisURL = process.env.REDIS_URL;
            vectorDb = new VectorDb( testAgent, {url: redisURL} ); // Initialize vector database
        });
        //close the db connection
        this.afterEach(() => vectorDb.redisClient.quit());
        describe("HashID testing", function() {
            describe("HashID testing", function() {
                it("should return a correct hashID given a string", function() {
                    let testHex = "taskDB:9f86d08188";
                    let testSecret = 'test';
                    let test = vectorDb.getHashId(testSecret);
                    expect(test).to.equal(testHex);
                });
                it("should not return a correct hashID given a random string", function() {
                    let testHex = "taskDB:9f86d08188";
                    let testSecret = 'badTestString';
                    let test = vectorDb.getHashId(testSecret);
                    expect(test).to.not.equal(testHex);
                });
            });
        });
        
    });
});