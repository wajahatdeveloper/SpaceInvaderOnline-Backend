import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import httpServer from "http";
import { Server } from "socket.io";

import { PORT } from "./support/constants";
import { newPlayerConnected } from "./lobby";
import { NetEvent, eventManager, useServer } from "./net-phaser-server";

dotenv.config();
const app = express();

app.use(cors());

const http = httpServer.createServer(app);
const socketServer = new Server(http);

useServer(socketServer);

eventManager.registerCallback(NetEvent.OnPlayerConnected, (playerSocket)=> newPlayerConnected(playerSocket, socketServer))

http.listen(PORT, () => {
  console.log(`Successfully started server on PORT : ${PORT}`);
});
