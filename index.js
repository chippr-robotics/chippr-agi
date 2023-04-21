import 'fs';
import 'vm';
import { CHIPPRAGI } from './core/ChipprAGI.js';
import ('./systems/CoreSystemLoader.mjs');

var events = [];
console.clear();
setInterval(() => {
    console.clear();
    console.log('|--- stats --|');
    console.log(`Entities: ${JSON.stringify(Object.keys(CHIPPRAGI.entities).length)}`);   
    console.log(`Components: ${JSON.stringify(CHIPPRAGI.components)}`);   
    console.log(`Systems: ${JSON.stringify(CHIPPRAGI.systems)}`); 
    console.log(`events: `);
    events.forEach( async msg => {
        console.log(msg);
    }); 
}, 1000);

CHIPPRAGI.on('*', (data) => {events.push(JSON.stringify(data))});

setTimeout(()=>{
    //emit an objective
    CHIPPRAGI.emit('CreateObjective', { objectiveDescription: process.env.OBJECTIVE || "Test the automation system!"});
}, 7000);

export { CHIPPRAGI }
