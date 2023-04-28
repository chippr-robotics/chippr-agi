import { WebSocket } from "ws";

const socket = new WebSocket("ws://localhost:8082");

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "allEntities") {
    console.log("Received all entities with components:", message.data);
  }
};

setInterval(()=> {
  socket.send(JSON.stringify({ type: "getAllEntities" }));
}, 5000);

setTimeout(()=> {
  socket.send(JSON.stringify({ type: "createObjective", data: "Write the worlds greatest robot detective novel!"  }));
}, 2000);
//> const WebSocket = require('ws')