import  {expect} from  "chai";
import { OpenAIAPI } from '../../openai.js';
/*{
    prompt : string latest prompt
    convo : {
        system :[] the context of the conversation
        user : [], 
        assistant : [] list of generated responses   
    }
} 
*/
//tests the core system class
describe("Langmodel: openai testing", function() {
    //setup the system for testing
    before(() => {
        var testConfig = {
            LANGUAGE_MODEL: {
                LANGUAGE_MODEL_API_KEY : process.env.LANGUAGE_MODEL.LANGUAGE_MODEL_API_KEY,
                LANGUAGE_MODEL_GENERATE_NAME :process.env.LANGUAGE_MODEL_GENERATE_NAME,
                LANGUAGE_MODEL_CHAT_NAME: process.env.LANGUAGE_MODEL_CHAT_NAME    
        }
         
    });
    describe("Class testing", function() {
        it("should allow new LangModel to be created", function() {
            let test = new OpenAIAPI(testConfig);
            //validate that test created a new system
            expect(test).to.not.be.undefined;
        });
    });
    
});