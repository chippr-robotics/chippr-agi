var expect    = require("chai").expect;
var  {VectorDb}  = require('../src');


describe("VectorDB function testing", function() {
    describe("Class testing", function() {
      it("should allow new vectorDB given agentID and redis url", function() {
        let testAgent = 'testAgent;'
        let redisURL = process.env.REDIS_URL;
        var vectorDb = new VectorDb( testAgent, {url: redisURL} ); // Initialize vector database
          
        expect(vectorDb.name).to.equal(testAgent);
        expect(vectorDb.index).to.equal(0);
        expect(vectorDb.indexName).to.equal('idx:vectorDB');
        vectorDb.redisClient.quit();
      });
    });
});