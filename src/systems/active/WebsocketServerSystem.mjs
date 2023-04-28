import WebSocket, { WebSocketServer } from 'ws';
import { CHIPPRAGI } from "../../index.js";

CHIPPRAGI.registerSystem("WebsocketServerSystem", {
  info: {
    version: "0.1.0",
    license: "Apache-2.0",
    developer: "CHIPPRBOTS",
    type: "connector",
    description: "A system that manages WebSocket communication.",
  },

  init: function () {
    this.webSocketServer = new WebSocketServer({ port: 8082 });

    this.webSocketServer.on("connection", (socket) => {
      CHIPPRAGI.Logger.info( { system : "WebSocketSystem", log : " WS Client connected"});
      socket.on("message", (message) => {
        //console.log(`Received message: ${message}`);
        CHIPPRAGI.Logger.info( { system : "WebSocketSystem", log : `newMessage: ${message}`});
        this.handleClientMessage(message, socket);
      });

      socket.on("close", () => {
        CHIPPRAGI.Logger.info( { system : "WebSocketSystem", log : "Client disconnected"});
      });
    });

    // Subscribe to a specific event from other systems
    CHIPPRAGI.subscribe("UPDATE", (data) => {
      this.handleUpdateMessage(data);
    });
  },

  handleClientMessage: async function (message, socket) {
    // Handle the incoming message from the browser
    // You can use pubsub-js to communicate the message to other systems if needed
    const parsedMessage = JSON.parse(message);

    switch(parsedMessage.type){
    case "getAllEntities":
      let allEntities = await CHIPPRAGI.getAllEntities('TaskParent');
      let cleanEntities = [];
      allEntities.forEach( element => {
        cleanEntities.push(element.split('idx:entities:')[1]);
      })
      socket.send(JSON.stringify({ type: "allEntities", data: cleanEntities }));
    break;
    case "getDetail":
      let detail = await CHIPPRAGI.getComponentData( parsedMessage.entityID, parsedMessage.componentName);
      socket.send(JSON.stringify({ type: "entityDetail", data : detail}));
      break;
    case "createObjective":
      CHIPPRAGI.MessageBus.updateMessage( 'createEntity', '0000000000', 'ObjectiveDescription', {}, { 
        task : parsedMessage.data,
    });  
    break;
    default:
      //dump on the message bus
      CHIPPRAGI.MessageBus.publish('UPDATE', message);
    }
  },

  handleUpdateMessage: function (data) {
    // Handle the message received from other systems via pubsub-js
    // If needed, you can send the message to the connected client(s)
    this.webSocketServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  },

  sendMessageToClient: function (socket, message) {
    // Send a message to the connected client
    socket.send(message);
  },
});
