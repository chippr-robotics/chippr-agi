
export class OpenAIApi {
    constructor(chipprConfig) {
        this.API_TOKEN = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_API_KEY;
        this.GENERATE_NAME = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_GENERATE_NAME;
        this.CHAT_NAME = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_CHAT_NAME
        this.DEFAULT_TEMP = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_TEMP;
        this.DEFAULT_MAX_TOKENS = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MAX_TOKENS;
        this.DEFAULT_MATCH_LENGTH = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH;    
    }

    async query( api, payload ) {
        //need to make the data into a JSON payload 
        
        console.log(`data:${payload}`)
        
        const response = await fetch(
            api,
            {
                headers: { 
                    Authorization: `Bearer ${this.API_TOKEN}` ,
                    'Content-Type': "application/json",
                },
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
        const result = await response.json();
        console.log(result);
        return result;
    }
    async createCompletion( prompt ) { 
        let payload ={
            model : this.GENERATE_NAME,
            prompt : prompt.prompt,
            temperature : prompt.temp || this.DEFAULT_TEMP,
            max_tokens : prompt.max_tokens || this.DEFAULT_MAX_TOKENS, 
        };
        console.log(`this is the data ${payload}`);
        let results = await this.query( `https://api.openai.com/v1/completions`, payload );
        //console.log("this is the results", results);
        //should return a string
        return results.generated_text;  
    };
    
    async createChat( payload ){
        /* needs an object 
        
        {
            prompt : string latest prompt
            convo : {
                system :[] the context of the conversation
                user : [], 
                assistant : [] list of generated responses   
            }
        } 
        transform to : save this in a file and a pointer in the db
        messages: [
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
        ]
        
       process the system messages first
       
        */
        const { prompt, convo } = payload;
        const messages = [];
      
        // Add the prompt as the first message
        messages.push({
          role: 'prompt',
          content: prompt,
          name: '',
        });
      
        // Combine the 'system', 'user', and 'assistant' arrays
        const combinedConvo = convo.system.map((msg, i) => ({
          role: 'system',
          content: msg,
          name: '',
          index: i,
        }))
          .concat(convo.user.map((msg, i) => ({
            role: 'user',
            content: msg,
            name: '',
            index: i,
          })))
          .concat(convo.assistant.map((msg, i) => ({
            role: 'assistant',
            content: msg,
            name: '',
            index: i,
          })));
      
        // Sort the combined conversation by index
        combinedConvo.sort((a, b) => a.index - b.index);
      
        // Add the sorted messages to the result array
        messages.push(...combinedConvo.map(({ role, content, name }) => ({ role, content, name })));
      

        let results = await this.query( `https://api.openai.com/v1/chat/completions`, messages );
        //should return a string
        return results.generated_text;
    };
}  