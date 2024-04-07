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
  username: string;
  avatarIndex: number;
}