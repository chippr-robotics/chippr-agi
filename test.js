import { CHIPPRAGI }  from "./index.js";

setTimeout(()=> {
    CHIPPRAGI.emit("createObjective", "This is a test objective");
},5000);
