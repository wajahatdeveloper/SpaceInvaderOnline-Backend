import { Socket } from "socket.io";

export class GamePlayer {
  clientId: string;
  socket: Socket;

  gameRoomId: string = "";
  registeredGameRoomEvents: boolean = false;

  username: string = "";
  isAlive: boolean = true;
  x: number = 0;
  y: number = 0;
  avatarIndex: number = 0;
  score: number = 0;

  constructor(clientId: string, socket: Socket, roomId: string) {
    this.clientId = clientId;
    this.socket = socket;
    this.gameRoomId = roomId;
    console.log(`New Player Joined room ${this.gameRoomId} with Id ${this.clientId}`);
  }
}
