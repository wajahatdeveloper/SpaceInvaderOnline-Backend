import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import httpServer from "http";
import { Server } from "socket.io";

import { PORT } from "./support/constants";
import { ClientData, NetEvent, eventManager, useServer } from "./net-phaser-server";

import { MIN_PLAYERS_TO_START_MATCH } from "./support/constants";
import { GameRoom } from "./gameRoom";
import { GamePlayer } from "./gamePlayer";

dotenv.config();
const app = express();

app.use(cors());

const http = httpServer.createServer(app);
const socketServer = new Server(http);

useServer(socketServer, { maxPlayersInSession : MIN_PLAYERS_TO_START_MATCH });

eventManager.registerCallback(NetEvent.OnSessionJoined, ({clientData, sessionId}:{clientData: ClientData, sessionId: string})=>
{
  let gameRoom: GameRoom;
  if(GameRoom.allGameRooms.has(sessionId)) {
    // room exists (at least one player already joined)
    gameRoom = GameRoom.allGameRooms.get(sessionId)!;
  } else {
    // room does not exist (this is the first player to join this room)
    gameRoom = new GameRoom(socketServer, sessionId);
    GameRoom.allGameRooms.set(sessionId, gameRoom);
  }

  // add joining player to the room
  const gamePlayer = new GamePlayer(clientData.id, clientData.socket, sessionId);
  gamePlayer.avatarIndex = 0;
  gamePlayer.isAlive = true;
  gamePlayer.score = 0;
  gameRoom.playersInRoom?.push(gamePlayer);

  // start match when required number of players joined the room
  if (gameRoom.playersInRoom.length >= MIN_PLAYERS_TO_START_MATCH) {
    gameRoom.startMatch();
  }
});

eventManager.registerCallback(NetEvent.OnSessionLeft, ({clientData, sessionId}:{clientData: ClientData, sessionId: string})=>{
  // remove player from room
  let gameRoom: GameRoom = GameRoom.allGameRooms.get(sessionId)!;
  const playerIndex = gameRoom.playersInRoom?.findIndex(x=>x.clientId == clientData.id)!;
  gameRoom.playersInRoom?.splice(playerIndex, 1);
});

http.listen(PORT, () => {
  console.log(`Successfully started server on PORT : ${PORT}`);
});