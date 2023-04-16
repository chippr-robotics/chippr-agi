const { Configuration, OpenAIApi } = require("openai");

//* setup openAI API 
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });


module.exports = new OpenAIApi(configuration);
  /* end setup */