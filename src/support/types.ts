import p2 from "p2";
import { Socket } from "socket.io";

export interface GamePlayerObject {
  clientId: string;
  gameRoomId: number;
  registeredGameRoomEvents: boolean;

  username: string;
  isAlive: boolean;
  x: number;
  y: number;
  avatarIndex: number;
  score: number;

  socket: Socket;
}

export interface GameRoomObject {
  id: number;

  bulletShootTimerValue: number;
  shipVelocityTimerValue: number;
  currentShipXPosition: number;

  p2World: p2.World | undefined;
  shipDynamicBody: p2.Body | undefined;
  
  isMatchStarted: boolean;

  playersInRoom: GamePlayerObject[] | undefined;
}

export interface MatchUpdateObject {
  shootBullet: boolean;
  shipPositionX: number;
  playerUpdates: PlayerUpdateObject[];
}

export interface PlayerUpdateObject {
  username: string;
  x: number;
  y: number;
  avatarIndex: number;
  score: number;
  isAlive: boolean;
}
