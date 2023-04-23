import { CHIPPRAGI } from "../../../index.js";

CHIPPRAGI.registerSystem('DashboardSystem', {
    info: {
        version : "0,0,0",
        license : "",
        developer: "",
        description : "this system displays a cli dashboard for system testing purposes",
    },

    init: function (_eventEmitter) {
        //if (CHIPPRAGI.DASHBOARD == true) {
            console.clear();
            /// show stats if bored
            console.log('|--- loading stats --|');
            if (CHIPPRAGI.DASHBOARD == true) this.dashboard(_eventEmitter);
            
        //}
    },
  
    dashboard: function (_eventEmitter){
      //display a basic dash board
      let events = [];
      _eventEmitter.on('*', (data) => {events.push(JSON.stringify(data))});
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
  
  remove: function (entityID) {
    // Do something when the component or its entity is detached, if needed.
    CHIPPRAGI.eventEmitter.off('emptySystem', this.handleEmptySystem);
    },
  
});
  

/*



*/