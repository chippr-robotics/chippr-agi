require('dotenv').config();

const { ChipprAGI } = require('./index.js');

const OBJECTIVE = process.env.OBJECTIVE;

var bot = new ChipprAGI(OBJECTIVE);

module.exports = { bot };