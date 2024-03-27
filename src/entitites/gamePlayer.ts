import { Socket } from "socket.io";

export class GamePlayer {
  static allGamePlayers: Map<string, GamePlayer> = new Map(); // key = clientId

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
    console.log(`New Player Created with Id ${clientId}`);
    GamePlayer.allGamePlayers.set(clientId, this);
  }

  static get(userName: string) : GamePlayer | undefined {
    GamePlayer.allGamePlayers.forEach((player, key, map) => {
      if(player.username == userName) return player;
    });
    console.log(`userName ${userName} not found!`);
    return undefined;
  }
}
