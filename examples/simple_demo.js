import { CHIPPRAGI }  from "../index.js";

setTimeout(()=> {
    CHIPPRAGI.emit("createObjective",{ objectiveDescription : "This is a test objective",});
    console.log('Creating test objective');
},10000);
