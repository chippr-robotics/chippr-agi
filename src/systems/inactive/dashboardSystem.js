/*
var events = [];
console.clear();

/// show stats if bored
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



*/