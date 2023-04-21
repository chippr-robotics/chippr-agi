import * as dotenv from 'dotenv';
dotenv.config();

import 'fs';
import 'vm';
import { CHIPPRAGI } from './core/ChipprAGI.js';
import ('./systems/CoreSystemLoader.mjs');

var events = [];
console.clear();

function dashboard(){
setInterval(() => {
    console.clear();
    console.log('|--- stats --|');
    console.log(`Entities: ${JSON.stringify(Object.keys(CHIPPRAGI.entities).length)}`);   
    console.log(`Components: ${JSON.stringify(CHIPPRAGI.components)}`);   
    console.log(`Systems: ${JSON.stringify(CHIPPRAGI.systems)}`); 
    console.log(`core loader: ${JSON.stringify(CHIPPRAGI.systems['CoreSystemLoader'])}`)
    console.log(`events: `);
    events.forEach( async msg => {
        console.log(msg);
    }); 
}, 1000);
}

dashboard();
CHIPPRAGI.on('*', (data) => {events.push(JSON.stringify(data))});
CHIPPRAGI.on('createObjective', (data) => {
   console.log(data);
  });

setTimeout(()=>{
    //emit an objective
    CHIPPRAGI.systems['CoreSystemLoader'].init(CHIPPRAGI.eventEmitter);
}, 1000);


setTimeout(()=>{
    //emit an objective
    console.log('sending objective');
    CHIPPRAGI.emit('createObjective', { objectiveDescription: process.env.OBJECTIVE || "Test the automation system!"});
}, 20000);


export { CHIPPRAGI }
