import { CHIPPRAGI } from "../../../index.js";

CHIPPRAGI.registerSystem('DashboardSystem', {
    info: {
        version : "0.1.0",
        license : "APACHE-2.0",
        developer: "CHIPPRBOTS",
        description : "This system displays a cli dashboard for system testing purposes",
    },

    init: function () {
        if (CHIPPRAGI.DASHBOARD == true){
            CHIPPRAGI.subscribe('SYSTEM', (type, eventData) => {
                this.dashboard(eventData[0]);
            });
        }
    },
  
    dashboard: function (eventData){
      //display a basic dash board
        let events = [];
        (eventData) => {events.push(JSON.stringify(data))};
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
    },
});
  

/*



*/