import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import httpServer from "http";
import { Server } from "socket.io";

import { PORT } from "./support/constants";
import { listenForRoomRequest } from "./lobby";

dotenv.config();
const app = express();

app.use(cors());

const http = httpServer.createServer(app);
const io = new Server(http);

io.on("connection", (socket: any) => {
  console.log(`New Player Connected with ID : ${socket.id}`);
  listenForRoomRequest(socket, io);

  socket.on("disconnect", (data: any) => {
    console.log(`Player Disconnected with ID : ${socket.id}`);
  });
});

http.listen(PORT, () => {
  console.log(`Successfully started server on PORT : ${PORT}`);
});
