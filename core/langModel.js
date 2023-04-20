import { Configuration, OpenAIApi } from "openai";

import * as dotenv from 'dotenv'
dotenv.config();

//* setup openAI API 
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

export const LangModel = new OpenAIApi(configuration); 
 



  /* end setup */