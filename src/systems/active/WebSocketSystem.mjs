import { WebSocket } from "ws";
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
    this.webSocketServer = new WebSocket.Server({ port: 8082 });

    this.webSocketServer.on("connection", (socket) => {
      CHIPPRAGI.Logger.info( { system : "WebSocketSystem", log : " WS Client connected"});
      socket.on("message", (message) => {
        //console.log(`Received message: ${message}`);
        this.handleClientMessage(message, socket);
      });

      socket.on("close", () => {
        CHIPPRAGI.Logger.info( { system : "WebSocketSystem", log : "Client disconnected"});
      });
    });

    // Subscribe to a specific event from other systems
    CHIPPRAGI.subscribe("UPDATE", (data) => {
      this.handleSystemMessage(data);
    });
  },

  handleClientMessage: function (message, socket) {
    // Handle the incoming message from the browser
    // You can use pubsub-js to communicate the message to other systems if needed
    CHIPPRAGI.publish("UPDATE", message);
  },

  handleSystemMessage: function (data) {
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
