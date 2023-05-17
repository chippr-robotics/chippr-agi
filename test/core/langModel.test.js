import  {expect} from  "chai";
import { OpenAIApi } from '../../src/core/LangModel/openai.js';
import {completionTest} from './testData.js';
import * as dotenv from "dotenv";

/*{
    prompt : string latest prompt
    convo : {
        system :[] the context of the conversation
        user : [], 
        assistant : [] list of generated responses   
    }
} 
*/
var testConfig;
//tests the core system class
describe("Langmodel: openai testing", function() {
    //setup the system for testing
    before(() => {
        dotenv.config({ path: '../.env' });
         testConfig = {
            LANGUAGE_MODEL: {
                LANGUAGE_MODEL_API_KEY : process.env.CHIPPRAGI_LANGUAGE_MODEL_API_KEY,
                LANGUAGE_MODEL_GENERATE_NAME :process.env.CHIPPRAGI_LANGUAGE_MODEL_GENERATE_NAME,
                LANGUAGE_MODEL_CHAT_NAME: process.env.CHIPPRAGI_LANGUAGE_MODEL_CHAT_NAME    
        }
    }
    });
    describe("Class testing", function() {
        it("should allow new LangModel to be created", function() {
            let test = new OpenAIApi(testConfig);
            //validate that test created a new system
            expect(test).to.not.be.undefined;
        });
    });
    
});