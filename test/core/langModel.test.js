var expect    = require("chai").expect;
var  { LangModel } = require('../../core');

//tests the core system class
describe("Core: LangModel Class function testing", function() {
    //setup the system for testing
    before(() => {
        require('dotenv').config();
    });
    describe("Class testing", function() {
        it("should allow new LangModel to be created", function() {
            let test = LangModel;
            //validate that test created a new system
            expect(test).to.not.be.undefined;
        });
    });
});