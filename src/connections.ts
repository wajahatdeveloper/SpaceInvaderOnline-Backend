import { Socket } from "socket.io";

const { listenForRoomRequest } = require('./lobby');
const globalData = require('./support/data');

let io: Socket;

function registerConnectionEvents(socket: Socket, ioInst: Socket) {
  io = ioInst;
  newPlayerConnected(socket);  
  socket.on('disconnect', data => { existingPlayerDisconnected(data, socket.id); });
}

function newPlayerConnected(socket: Socket) {
  globalData.allPlayers.set(socket.id, {...globalData.defaultPlayerObject, socket});
  console.log(`New Player Connected with ID : ${socket.id} , TotalPlayersCount: ${globalData.allPlayers.size}`);

  listenForRoomRequest(socket, io);
}

function existingPlayerDisconnected(data: any, socketId: string) {
  globalData.allPlayers.delete(socketId);
  console.log(`Player Disconnected with ID : ${socketId}, TotalPlayersCount: ${globalData.allPlayers.size}`);
}

module.exports = {
  registerConnectionEvents
};