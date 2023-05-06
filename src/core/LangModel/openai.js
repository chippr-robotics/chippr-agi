
export class OpenAIApi {
    constructor(chipprConfig) {
        this.API_TOKEN = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_API_KEY;
        this.GENERATE_NAME = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_GENERATE_NAME;
        this.CHAT_NAME = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_CHAT_NAME
        this.DEFAULT_TEMP = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_TEMP;
        this.DEFAULT_MAX_TOKENS = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MAX_TOKENS;
        this.DEFAULT_MATCH_LENGTH = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH;    
    }

    async query( data ) {
        const response = await fetch(
            data.api,
            {
                headers: { 
                    Authorization: `Bearer ${this.API_TOKEN}` ,
                    'Content-Type': "application/json",
                },
                method: "POST",
                body: JSON.stringify(data.payload),
            }
        );
        const result = await response.json();
        return result;
    }
    async createCompletion( prompt ) { 
        let payload ={
            model : this.GENERATE_NAME,
            prompt : prompt.prompt,
            temperature : prompt.temp || this.DEFAULT_TEMP,
            max_tokens : prompt.max_tokens || this.DEFAULT_MAX_TOKENS, 
        };
        //console.log(`this is the data ${JSON.stringify(data)}`);
        let results = await this.query({ api : `https://api.openai.com/v1/completions`, data : payload });
        //console.log("this is the results", results);
        //should return a string
        return results.generated_text;  
    };
    
    async createChat( prompt ){
        let conversation = {};
        /* needs an object {
            prompt : string latest prompt
            convo : {
                system :[] the context of the conversation
                user : [],
                assistant : [] list of generated responses   
            }
        } 
        transform to : save this in a file and a pointer in the db
        {
            messages: {
                {
                    role: 
                    content:
                    name:
                },
                {
                    role: 
                    content: 
                    name
                }
            }
        }
        */
        let messages = 

        let payload ={
            inputs :{ 
                model = this.CHAT_NAME,
                text : prompt.prompt,
                generated_responses = prompt.responses || null,//an array
                past_user_inputs = prompt.past_prompts || null,//an array
            },
            parameters : {
                temperature : prompt.temp || this.DEFAULT_TEMP,
                max_new_tokens : prompt.max_tokens || this.DEFAULT_MAX_TOKENS, 
            },
            options : {
                use_cache : false,
                wait_for_model : true,
            }
        };
        let results = await this.query( { api : `https://api.openai.com/v1/chat/completions`, data: payload} );
        //should return a string
        return results.generated_text;
    };
}  