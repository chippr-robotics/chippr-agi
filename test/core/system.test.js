var expect    = require("chai").expect;
const EventEmitter = require('events');
var  { System } = require('../../core');

//tests the core system class
describe("Core System Class function testing", function() {
    //setup the system for testing
    describe("Class testing", function() {
        it("should allow new system to be created", function() {
            let testEventEmitter = new EventEmitter();
            let test = new System(testEventEmitter);
            //validate that test created a new system
            expect(test.entityIds.size).to.equal(0);
        });
    });
    describe("class function testing", function() {
        // a test for each function
        // comnon variables
        let testID = '0123456789';
        let system;
        let testEventEmitter;
        beforeEach(() => {
            testEventEmitter = new EventEmitter();
            system = new System(testEventEmitter);
        })
        describe("addEntity function testing", function() {
            it("should add a new entity to this.entitySet", function() {
                system.addEntity(testID);
                expect(system.entityIds.size).to.equal(1);
                expect(system.entityIds.has(testID)).to.be.true;
            });
        });
        describe("removeEntity function testing", function() {
            it("should remove an entity from this.entitySet", function() {
                system.addEntity(testID);
                system.removeEntity(testID);
                expect(system.entityIds.size).to.equal(0);
                expect(system.entityIds.has(testID)).to.be.false;
            });
        });
    });

});