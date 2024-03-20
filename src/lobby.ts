import { Server, Socket } from "socket.io";
import { MIN_PLAYERS_TO_START_MATCH } from "./support/constants";
import { GamePlayer } from "./entitites/gamePlayer";
import { GameRoom } from "./entitites/gameRoom";

let socketIO : Server;

export function newPlayerConnected(socket: Socket, socketIOInst: Server) {
  socketIO = socketIOInst;
  let clientId: string = socket.handshake.query.clientId?.toString()!;
  
  // check if player is reconnecting
  if (GamePlayer.allGamePlayers.has(clientId))  {
    // player already exists
  }
  else  {
    // treat as new player
    let newPlayer: GamePlayer = new GamePlayer(clientId, socket);
    // start listening for player room events
    newPlayer.socket.on("requestRoom", (clientId) => arrangeRoom(clientId, socket)); // data = username, clientId
    newPlayer.socket.on("enterRoom", (data) => onPlayerEnterRoom(socket, data));
    newPlayer.socket.on("leaveRoom", (data) => onPlayerLeaveRoom(socket, data));
  }
  
}

function arrangeRoom(username: any, socket: Socket) {
  // check if an existing player is waiting for room
  let partialFilledRooms: Array<GameRoom> = new Array<GameRoom>();
  GameRoom.allGameRooms.forEach((gameRoom, key, map)=>{
    if(gameRoom.playersInRoom!.length < MIN_PLAYERS_TO_START_MATCH) {
      partialFilledRooms.push(gameRoom);
    }
  });
  
  let singleRoom = (partialFilledRooms.length > 0) ? partialFilledRooms[0] : undefined;
  if(singleRoom === undefined) {
    // no empty roooms found
    // create a new room
    singleRoom = new GameRoom(socketIO);
    GameRoom.allGameRooms.set(singleRoom.roomId, singleRoom);
  }

    if (singleRoom.playersInRoom!.length < MIN_PLAYERS_TO_START_MATCH) {
      let player = GamePlayer.get(username);
      singleRoom.playersInRoom!.push(player!);
    }

    if(singleRoom.playersInRoom!.length === MIN_PLAYERS_TO_START_MATCH) {
      // at least two players are available for match making
      // create a new game room and assign these players together
      const p1 = singleRoom.playersInRoom![0];
      const p2 = singleRoom.playersInRoom![1];

      p1.gameRoomId = singleRoom.roomId;
      p2.gameRoomId = singleRoom.roomId;

      p1.socket.join(singleRoom.roomId.toString());
      p2.socket.join(singleRoom.roomId.toString());

      setTimeout(function () {
        socketIO.to(singleRoom!.roomId.toString()).emit("joined-room", { gameRoomId: singleRoom!.roomId });

        setTimeout(function () {
          socketIO.to(singleRoom!.roomId.toString()).emit("start-game");
        }, 1000);
      }, 500);
    }
}

function onPlayerEnterRoom(socket: Socket, player: GamePlayer) {
  console.log(
    `Player with ID : ${player.clientId} and Username: ${player.username} has Entered Room : ${player.gameRoomId} `
  );
}

function onPlayerLeaveRoom(socket: Socket, player: GamePlayer) {
  console.log(
    `Player with ID : ${player.clientId} and Username: ${player.username} has Left Room : ${player.gameRoomId} `
  );
}