import { rateLimitsConfig } from "./ratelimits.js";
import { Configuration, OpenAIApi } from "openai";
import { HuggingFaceApi } from "./huggingface.js";
import { NoOpClient } from "./no-op-client.js";

export class LanguageModel {
  constructor(chipprConfig) {
    this.rateLimit = rateLimitsConfig[chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_RATE_LIMIT_TYPE];
    this.requestQueue = {};
    this.init();

    if (chipprConfig.TESTING != true) {
      switch(chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_ID){
      case 'openai':
        this.model = new OpenAIApi(chipprConfig);
      break;
      case 'huggingface':
        this.model = new HuggingFaceApi(chipprConfig);
      break;
      default:
    }
      if (chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_ID === 'openai') {
        const configuration = new Configuration({
          apiKey: chipprConfig.LANGUAGE_MODEL.LANGUAGE_MODEL_API_KEY,
        });
        
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

  init() {
    for (const type in this.rateLimit) {
      // Initialize an empty array for each request type
      this.requestQueue[type] = [];
      //console.log(type);
      this.startRateLimitedInterval(type, this.rateLimit[type]);
    }
  }
    
  async processRequestQueue(callType) {
    if (this.requestQueue[callType].length > 0) {
      let response;
      const request = this.requestQueue[callType].shift();
      // Execute the request
      switch (callType) {
        //send to model these are separated incase anything special needs to happen before sending
        case 'completion':
          response = await this.model.createCompletion(request.data);
          break;
        case 'chat':
          response = await this.model.createChat(request.data);
          break;      
        case 'codex':
          response = await this.model.createCodex(request.data);
          break;
        case 'edit':
          response = await this.model.createEdit(request.data);
          break;
        case 'image':
          response = await this.model.createImage(request.data);
          break;
        case 'audio':
          response = await this.model.createEmbedding(request.data);
          break;
        default:
          console.error(`Invalid request type: ${request.callType}`);
      };
      request.resolve(response);
    }
  };

  startRateLimitedInterval(type, rateLimitPerMinute) {
    const intervalTime = Math.floor(60000 / rateLimitPerMinute);
      setInterval(() => {
          this.processRequestQueue(type);
     }, intervalTime);
  }

  addRequest(callType, data) {
    return new Promise((resolve) => {
      this.requestQueue[callType].push({ data, resolve });
    });
  }

  async generate(_prompt) {
    let response = await this.addRequest( 
      'completion',{
        prompt: _prompt,
      });
    //response should return a string
    //console.log(`Lang Model: ${response}`);
    return response;
    }
}

