require('dotenv').config();

const { ChipprAGI } = require('../index.js');

const OBJECTIVE = process.env.OBJECTIVE;

const bot = new ChipprAGI(OBJECTIVE);

bot.run()