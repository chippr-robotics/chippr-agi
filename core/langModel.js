import { Configuration, OpenAIApi } from "openai";
import * as dotenv from 'dotenv';
dotenv.config();

class LanguageModel {
  constructor() {
    if (!process.env.TESTING) {
      if (process.env.LANG_MODEL === 'openai') {
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.model = new OpenAIApi(configuration);
      }
      // Add other language models here, e.g., 'gptx':
      // else if (process.env.LANG_MODEL === 'gptx') {
      //   // Initialize GPT-X model
      // }
    } else {
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
}

export const LangModel = new LanguageModel();
