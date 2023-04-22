var expect    = require("chai").expect;
const EventEmitter = require('events');
//create a test agi
const { ChipprAGI } = require('../../index.js');
var  system  = require('../../systems/TaskCreationSystem');

// get any components the system uses
//var TaskDescriptionComponent = require('../../components/TaskDescription');
//tests

describe("TaskCreationSystem function testing", function() {

    before(() => {
        require('dotenv').config();
    });
    //setup the system for testing
    describe("Basic class testing", function() {
        it("should allow new TaskCreationSystem to be created", function() {
            let testEventEmitter = new EventEmitter();
            system.init(testEventEmitter);
        });
    });

});
