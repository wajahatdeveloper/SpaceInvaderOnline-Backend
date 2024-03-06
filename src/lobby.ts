import { Server, Socket } from "socket.io";
import { MIN_PLAYERS_TO_START_MATCH } from "./support/constants";
import * as utility from "./support/utility";

let io: Server;

export function listenForRoomRequest(socket: Socket, ioInst: Server) {
  io = ioInst;
  socket.on("request-room", (data) => arrangeRoom(data, socket)); // data = username, clientId
}

function arrangeRoom(data: any, socket: Socket) {
  // register player
  socket.on("enter-room", (data) => onPlayerEnterRoom(socket, data));
  socket.on("leave-room", (data) => onPlayerLeaveRoom(socket, data));

  // check if an existing player is waiting for room
  allGameRooms.forEach((gameRoom) => {
    if (gameRoom.playersInRoom!.length < MIN_PLAYERS_TO_START_MATCH) {
      // add joining player to this room
      const newPlayer: GamePlayerObject = {
        username: data.username,
        x: utility.getRandomXPosition(),
        y: 20, // start from top
        avatarIndex: utility.getRandomAvatarIndex(),
        score: 0,
        isAlive: true,
        clientId: data.clientId,
        gameRoomId: gameRoom.id,
        registeredGameRoomEvents: false,
        socket: socket,
      };
      gameRoom.playersInRoom!.push(newPlayer);
      
    }

    if(gameRoom.playersInRoom!.length === MIN_PLAYERS_TO_START_MATCH) {
      // at least two players are available for match making
      // create a new game room and assign these players together
      const p1 = gameRoom.playersInRoom![0];
      const p2 = gameRoom.playersInRoom![1];
      const roomId = createNewRoom();

      p1.gameRoomId = roomId;
      p2.gameRoomId = roomId;

      p1.socket.join(roomId.toString());
      p2.socket.join(roomId.toString());

      setTimeout(function () {
        io.to(roomId.toString()).emit("joined-room", { roomId });

        setTimeout(function () {
          io.to(roomId.toString()).emit("start-game");
        }, 1000);
      }, 500);
    }
  });
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
  console.log(
    `Player with ID : ${player.clientId} and Username: ${player.username} has Entered Room : ${player.gameRoomId} `
  );

  const gameRoom: GameRoomObject = allGameRooms.get(player.gameRoomId)!;
}

function onPlayerLeaveRoom(socket: Socket, player: GamePlayerObject) {
  console.log(
    `Player with ID : ${player.clientId} and Username: ${player.username} has Left Room : ${player.gameRoomId} `
  );

  const gameRoom = allGameRooms.get(player.gameRoomId)!;

  if (gameRoom.playersInRoom!.length <= 0) {
    deleteRoom(gameRoom.id);
  }
}

module.exports = {
  listenForRoomRequest,
};
