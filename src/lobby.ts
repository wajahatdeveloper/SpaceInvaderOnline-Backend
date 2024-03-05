import { Socket } from "socket.io";
import { GamePlayerObject, GameRoomObject } from "./support/types";
import { allPlayers, allGameRooms, currentGameRoomId, deleteRoom } from "./support/data";
import * as utility from './support/utility';

let io: Socket;

function listenForRoomRequest(socket: Socket, ioInst: Socket) {
  io = ioInst;
  socket.on('request-room', data => arrangeRoom(data, socket));
}

function arrangeRoom(data: any, socket: Socket) {
  // register player
  socket.on('enter-room', data => onPlayerEnterRoom(socket, data));
  socket.on('leave-room', data => onPlayerLeaveRoom(socket, data));
  //* serverData.allPlayers.set(data.username, {...serverData.defaultPlayerObject, username: data.username, clientId: data.clientId});

  // check if an existing player is waiting for room
  const openPlayers: GamePlayerObject[] = [];
  allPlayers.forEach(player => {if (player.gameRoomId === 0) openPlayers.push(player);});
  if (openPlayers.length > 1) {
    // at least two players are available for match making
    // create a new game room and assign these players together
    const p1 = openPlayers[0];
    const p2 = openPlayers[1];
    const roomId = createNewRoom();

    p1.gameRoomId = roomId;
    p2.gameRoomId = roomId;

    p1.socket.join(roomId.toString());
    p2.socket.join(roomId.toString());

    setTimeout(function() {
      io.to(roomId.toString()).emit('joined-room', { roomId });

      setTimeout(function() {
        io.to(roomId.toString()).emit('start-game');
      }, 1000);

    }, 500);
  } else {
    // there are no additional players waiting, that means this is the only player
    // wait for more players to connect for pairing
  }
}

function createNewRoom() {
  const roomId = currentGameRoomId + 1;
  const newRoom: GameRoomObject = {
    id: roomId,
    bulletShootTimerValue: 0,
    currentShipXPosition: 0,
    shipVelocityTimerValue: 0,
    isMatchStarted: false,
    p2World: undefined,
    playersInRoom: undefined,
    shipDynamicBody: undefined,
  };
  allGameRooms.set(roomId, newRoom);
  return roomId;
}

function onPlayerEnterRoom(socket: Socket, player: GamePlayerObject) {
  console.log(`Player with ID : ${player.clientId} and Username: ${player.username} has Entered Room : ${player.gameRoomId} `);

  const gameRoom: GameRoomObject = allGameRooms.get(player.gameRoomId)!;
  let playerCount: number = gameRoom.playersInRoom?.length!;
  playerCount++;

  // add player data to room
  const newPlayer: GamePlayerObject = {
    username: player.username,
    x: utility.getRandomXPosition(),
    y: 20,  // start from top
    avatarIndex: utility.getRandomAvatarIndex(),
    score: 0,
    isAlive: true,
    clientId: player.clientId,
    gameRoomId: gameRoom.id,
    registeredGameRoomEvents: player.registeredGameRoomEvents,
    socket: player.socket,
  }
  gameRoom!.playersInRoom!.push(newPlayer);
}

function onPlayerLeaveRoom(socket: Socket, player: GamePlayerObject) {
  console.log(`Player with ID : ${player.clientId} and Username: ${player.username} has Left Room : ${player.gameRoomId} `);
  
  const gameRoom = allGameRooms.get(player.gameRoomId)!;
  let playerCount: number = gameRoom.playersInRoom?.length!;
  playerCount--;

  if (playerCount <= 0) {
    deleteRoom(gameRoom.id);
  }
}

module.exports = {
  listenForRoomRequest,
};