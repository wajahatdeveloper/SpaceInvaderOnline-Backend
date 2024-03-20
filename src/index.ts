import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import httpServer from "http";
import { Server, Socket } from "socket.io";

import { PORT } from "./support/constants";
import { newPlayerConnected } from "./lobby";

dotenv.config();
const app = express();

app.use(cors());

const http = httpServer.createServer(app);
const socketIO = new Server(http);

socketIO.on("connection", (socket: Socket) => {
  console.log(`New Player Connected with Socket ID : ${socket.id}`);
  newPlayerConnected(socket, socketIO);

  socket.on("disconnect", (data: any) => {
    console.log(`Player Disconnected with Socket ID : ${socket.id}`);
  });
});

http.listen(PORT, () => {
  console.log(`Successfully started server on PORT : ${PORT}`);
});
