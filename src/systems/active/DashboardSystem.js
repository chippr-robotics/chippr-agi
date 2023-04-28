import { CHIPPRAGI } from "../../index.js";

CHIPPRAGI.registerSystem('DashboardSystem', {
    info: {
        version : "0.1.0",
        license : "APACHE-2.0",
        developer: "CHIPPRBOTS",
        description : "This system displays a cli dashboard for system testing purposes",
    },

    init: function () {
        CHIPPRAGI.Logger.info({system: 'DashBoardSystem', log:`Dashboard test ${CHIPPRAGI.DASHBOARD }`});
        if (CHIPPRAGI.DASHBOARD == true){
            console.clear;
            this.dashboard();
        }
    },
  
    dashboard: function (){
      //display a basic dash board
        setInterval(() => {
            console.clear();
            console.log('|--- stats --|');
            console.log(`Entities: ${JSON.stringify(Object.keys(CHIPPRAGI.entities).length)}`);   
            console.log(`Components: ${JSON.stringify(CHIPPRAGI.components)}`);   
            console.log(`Systems: ${JSON.stringify(CHIPPRAGI.systems)}`); 
            console.log(`core loader: ${JSON.stringify(CHIPPRAGI.systems['CoreSystemLoader'])}`)
        }, 1000);
    },
});
  

/*



*/