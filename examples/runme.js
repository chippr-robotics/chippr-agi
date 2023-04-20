require('dotenv').config();

const { ChipprAGI } = require('../index.js');

const CHIPPRAGI = new ChipprAGI();

require('../systems/CoreSystemLoader')

CHIPPRAGI.emit('createObjective', {});
module.exports = {CHIPPRAGI};