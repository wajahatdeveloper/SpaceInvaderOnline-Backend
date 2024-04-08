export interface MatchUpdateObject {
  shootBullet: boolean;
  shipPositionX: number;
  playerUpdates: PlayerUpdateObject[];
}

export interface PlayerUpdateObject {
  x: number;
  y: number;
  score: number;
  isAlive: boolean;
}

export interface MatchInitalObject {
  playerInitals: PlayerInitalObject[];
}

export interface PlayerInitalObject {
  startX: number;
  startY: number;
  username: string;
  avatarIndex: number;
}