import 'fs';
import 'vm';
import { CHIPPRAGI } from './core/ChipprAGI.js';
import ('./systems/CoreSystemLoader.mjs');
console.clear();
setInterval(() => {
    console.clear();
    console.log('|--- stats --|');
    console.log(`Entities: ${JSON.stringify(CHIPPRAGI.entities)}`);   
    console.log(`Components: ${JSON.stringify(CHIPPRAGI.components)}`);   
    console.log(`Systems: ${JSON.stringify(CHIPPRAGI.systems)}`);   
}, 2000);

export {CHIPPRAGI}
