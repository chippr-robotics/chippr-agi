import { Configuration, OpenAIApi } from "openai";

export class LanguageModel {
  constructor(chipprConfig) {
    this.MODEL_NAME = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_NAME;
    this.DEFAULT_TEMP = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_TEMP;
    this.DEFAULT_MAX_TOKENS = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MAX_TOKENS;
    this.DEFAULT_MATCH_LENGTH = chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_DEFAULT_MATCH_LENGTH;
    if (chipprConfig.TESTING != true) {
      if (chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_ID === 'openai') {
        const configuration = new Configuration({
          apiKey: chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_API_KEY,
        });
        this.model = new OpenAIApi(configuration);
      }
      // Add other language models here, e.g., 'gptx':
      // else if (chipprConfig === 'gptx') {
      //   // Initialize GPT-X model
      // }
    } else {
      //USE THE NOOP MODEL if testing is enabled
      this.model = this.createNoOpClient();
    }
  }

  createNoOpClient() {
    let tests = {
      data:{
        choices: [{
          text: 'TESTING',
        }],
        data: [{
          embedding: 'TESTING',
        }]
      },
    }
    return {

      createCompletion: () => Promise.resolve(tests),
      createEmbedding: () => Promise.resolve(tests),
      // Add any other methods that you need to mock during testing
    };
  }

  // Proxy methods to the underlying model
  createCompletion(params) {
    return this.model.createCompletion(params);
  }
  
  createEmbedding(params){
    return this.model.createEmbedding(params);
  }
  // Add other methods as needed

  async generate(_prompt) {
    let response = await this.createCompletion({
        model: this.MODEL_NAME,
        prompt: _prompt,
        temperature: parseInt(this.DEFAULT_TEMP, 10),
        max_tokens: parseInt(this.DEFAULT_MAX_TOKENS, 10),
    });
    //console.log(`Lang Model: ${response}`);
    //console.log(`Lang Model: ${response}`);
    return response.data.choices[0].text;
  }
}

