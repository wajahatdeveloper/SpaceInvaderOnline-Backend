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

  constructor(clientId: string, socket: Socket) {
    this.clientId = clientId;
    this.socket = socket;
  }
}
