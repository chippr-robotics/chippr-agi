import { CHIPPRAGI }  from "./index.js";

setTimeout(()=> {
    CHIPPRAGI.emit("createObjective",{ objectiveDescription : "This is a test objective",});
    console.log('fired');
},10000);
