const PORT: number = +process.env.PORT! || 8000;
const GAME_TICKER_MS: number = 100;
const CANVAS_WIDTH: number = 1400;
const CANVAS_HEIGHT: number = 750;
const SHIP_POSITION_Y: number = CANVAS_HEIGHT - 32;
const BULLET_SHOOT_POS_Y: number = SHIP_POSITION_Y;
const MIN_PLAYERS_TO_START_MATCH: number = 2;
const PHYSICS_WORLD_TIMESTEP: number = 1 / 16;
const PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL: number = 1000;
const PLAYER_VERTICAL_INCREMENT: number = 20;
const PLAYER_SCORE_INCREMENT: number = 5;
const START_POS_X: number = 20;
const START_POS_Y: number = 20;

const INBOUND_MATCH_EVENT_PLAYER_INPUT = 'player-input';  // received player input
const INBOUND_MATCH_EVENT_PLAYER_LOST = 'player-hit';    // player lost by hitting a bullet client side
const OUTBOUND_MATCH_EVENT_PLAYER_WON = 'player-won';     // player won by reaching the bottom alive
const OUTBOUND_MATCH_EVENT_PLAYER_LOST = 'player-lost';   // player lost by leaving the match
const OUTBOUND_MATCH_EVENT_MATCH_UPDATE = 'match-state';  // match update tick info
const OUTBOUND_MATCH_EVENT_MATCH_INITAL = 'match-inital'; // match inital info about all players

export {
  PORT,
  GAME_TICKER_MS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SHIP_POSITION_Y,
  BULLET_SHOOT_POS_Y,
  MIN_PLAYERS_TO_START_MATCH,
  PHYSICS_WORLD_TIMESTEP,
  PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL,
  PLAYER_VERTICAL_INCREMENT,
  PLAYER_SCORE_INCREMENT,
  INBOUND_MATCH_EVENT_PLAYER_INPUT,
  INBOUND_MATCH_EVENT_PLAYER_LOST,
  OUTBOUND_MATCH_EVENT_PLAYER_WON,
  OUTBOUND_MATCH_EVENT_PLAYER_LOST,
  OUTBOUND_MATCH_EVENT_MATCH_INITAL,
  OUTBOUND_MATCH_EVENT_MATCH_UPDATE,
  START_POS_X,
  START_POS_Y,
};
