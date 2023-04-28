import { WebSocket } from "ws";

const socket = new WebSocket("ws://localhost:8082");

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch(message.type){
    case "allEntities":
      console.log("Received all entities with components:", message.data);
      message.data.forEach(element => {
        socket.send(JSON.stringify({ type: "getDetail", entityID : element, componentName : 'TaskDescription' }));
      });
    break;
    case "entityDetail":
      console.log("Received entitie detail:", message.data);
  }
};

setInterval(()=> {
  socket.send(JSON.stringify({ type: "getAllEntities" }));
}, 5000);

setTimeout(()=> {
  socket.send(JSON.stringify({ type: "createObjective", data: "Write the worlds greatest robot detective novel!"  }));
}, 2000);
//> const WebSocket = require('ws')