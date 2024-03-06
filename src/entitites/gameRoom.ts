import p2 from "p2";
import { GamePlayer } from "./gamePlayer";

export class GameRoom {
  static roomIdIndex: number = 0;
  static allGameRooms: Map<string, GameRoom> = new Map(); // key = roomId

  roomId: string = "";

  bulletShootTimerValue: number = 0;
  shipVelocityTimerValue: number = 0;
  currentShipXPosition: number = 0;

  p2World: p2.World | undefined;
  shipDynamicBody: p2.Body | undefined;

  isMatchStarted: boolean = false;

  playersInRoom: GamePlayer[] | undefined;

  constructor() {
    this.roomId = (GameRoom.roomIdIndex + 1).toString();
  }

  delete(): void {
    GameRoom.allGameRooms.delete(this.roomId);
  }
}
