const { Configuration, OpenAIApi } = require("openai");

//* setup openAI API 
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

const openai_config = new OpenAIApi(configuration);
module.exports = {
    openai_config : openai_config
}
  /* end setup */