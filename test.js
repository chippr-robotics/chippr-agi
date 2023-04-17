require('dotenv').config();

const { ChipprAGI } = require('./index.js');

const OBJECTIVE = process.env.OBJECTIVE;

var bot = new ChipprAGI(OBJECTIVE);

//bot.vectorDb.create();

async function main(){
    var vector = await bot.getEmbeddings('this is a test');

    console.log("getting vector");
    bot.vectorDb.save("test123", vector);
    console.log("getting results");
    var results = await bot.vectorDb.getNeighbors(vector);
    console.log(results);
}

function hashTest(){
    let testHex = "taskDB:9f86d08188";
    let test = bot.vectorDb.getHashId('test');
    console.log(test);
    (test == testHex) ? console.log('hashes match') : console.log('hashes do not match')  ;
    
}

hashTest();

