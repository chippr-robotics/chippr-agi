
export class OpenAIApi {
    constructor(chipprConfig) {
        this.API_TOKEN = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_API_KEY;
        this.GENERATE_NAME = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_GENERATE_NAME;
        this.DEFAULT_TEMP = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_TEMP;
        this.DEFAULT_MAX_TOKENS = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MAX_TOKENS;
        this.DEFAULT_MATCH_LENGTH = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH;    
    }

    async query( data ) {
        const response = await fetch(
            `https://api.openai.com/v1/completions`,
            {
                headers: { 
                    Authorization: `Bearer ${this.API_TOKEN}` ,
                    'Content-Type': "application/json",
                },
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        const result = await response.json();
        return result;
    }
    async createCompletion( prompt ) { 
        let data ={
            model : this.GENERATE_NAME,
            prompt : prompt.prompt,
            temperature : prompt.temp || this.DEFAULT_TEMP,
            max_tokens : prompt.max_tokens || this.DEFAULT_MAX_TOKENS, 
        };
        console.log(`this is the data ${JSON.stringify(data)}`);
        let results = await this.query( data );
        console.log("this is the results", results);
        //should return a string
        return results.generated_text;  
    };
}  