require('dotenv').config();
const {createClient, SchemaFieldTypes, VectorAlgorithms,SearchOptions, transformArguments, transformReply } = require("redis");
const { ChipprAGI } = require('./index.js');

const OBJECTIVE = process.env.OBJECTIVE;

var bot = new ChipprAGI(OBJECTIVE);

//bot.vectorDb.create();

async function main(){
    var vector = await bot.getEmbeddings('this is a test');

    console.log("getting vector");
    bot.vectorDb.save("test123", vector);
    console.log("getting results");
    var results = await bot.vectorDb.getNeighbors("test123");
    console.log(results);
}

main();

