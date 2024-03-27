import p2 from "p2";
import { GamePlayer } from "./gamePlayer";
import { Server } from "socket.io";

export class GameRoom {
  static roomIdIndex: number = 0;
  static allGameRooms: Map<string, GameRoom> = new Map(); // key = roomId

  playersInRoom: GamePlayer[] | undefined = new Array<GamePlayer>();

  roomId: string = "";
  isMatchStarted: boolean = false;

  bulletShootTimerValue: number = 0;
  shipVelocityTimerValue: number = 0;
  currentShipXPosition: number = 0;

  p2World: p2.World | undefined;
  shipDynamicBody: p2.Body | undefined;

  socketIO: Server;

  constructor(socketIOInst: Server) {
    this.roomId = (GameRoom.roomIdIndex + 1).toString();
    this.socketIO = socketIOInst;
    console.log(`New Room Created with Id ${this.roomId}`);
  }

  update(): void {

  }

  delete(): void {
    GameRoom.allGameRooms.delete(this.roomId);
  }
}
