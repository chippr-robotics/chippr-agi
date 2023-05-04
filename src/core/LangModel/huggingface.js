import fetch from "node-fetch";

export class HuggingFaceApi {
    constructor(chipprConfig){
        this.API_TOKEN = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_API_KEY;
        this.GENERATE_NAME = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_GENERATE_NAME;
        this.DEFAULT_TEMP = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_TEMP;
        this.DEFAULT_MAX_TOKENS = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MAX_TOKENS;
        this.DEFAULT_MATCH_LENGTH = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH;
    }

    async query( data, model ) {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                headers: { Authorization: `Bearer ${this.API_TOKEN}` },
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        const result = await response.json();
        return result;
    }

    async createCompletion( prompt ) { 
        let data ={
            inputs : prompt.prompt,
            parameters : {
                temperature : prompt.temp || this.DEFAULT_TEMP,
                max_new_tokens : prompt.max_tokens || this.DEFAULT_MAX_TOKENS, 
                return_full_text : false,
            },
            options : {
                use_cache : false,
                wait_for_model : true,
            }
        };
            
        let results = await this.query( data , this.GENERATE_NAME );
        //should return a string
        return results.generated_text;
        
    };
    /*
    createEmbedding() { return  Promise.resolve(this.tests)};
    createChat(){return  Promise.resolve(this.tests)};
    createCodex(){return  Promise.resolve(this.tests)};
    createEdit(){return  Promise.resolve(this.tests)};
    createImage(){return  Promise.resolve(this.tests)};
    createAudio(){return  Promise.resolve(this.tests)};
    // Add any other methods that you need to mock during testing    
    */
};