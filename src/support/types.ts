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