import { WebSocket } from "ws";

const socket = new WebSocket("ws://localhost:8082");
const entities = [];
const components = [];

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
  switch(message.type){
    case "allEntities":
      console.log("Received all entities with components:", message.data);
      message.data.forEach(element => {
        components.forEach( component => {
          socket.send(JSON.stringify({ type: "getComponent", entityID : element, componentName : component }));
        });
      });
      break;
    case "allComponents":
      //console.log("Received all components:", message.data);
      for (var i in message.data[0]){
        if (components.includes(i) != true) components.push(i); 
      }; 
      console.log(`component list: ${components}`);
      break;
    case "entityDetail":
      console.log("Received entity detail:", message.data);
  }
};

setInterval(()=> {
  socket.send(JSON.stringify({ type: "getAllEntities" }));
}, 5000);

setInterval(()=> {
  socket.send(JSON.stringify({ type: "getAllComponents" }));
}, 5000);


setInterval(()=> {
  socket.send(JSON.stringify({ type: "saveData" , componentName: 'IPFScid', data: "this is a test!" }));
}, 5000);
/*
setTimeout(()=> {
  socket.send(JSON.stringify({ type: "createObjective", data: "Write the worlds greatest robot detective novel!"  }));
}, 2000);
//> const WebSocket = require('ws')
*/