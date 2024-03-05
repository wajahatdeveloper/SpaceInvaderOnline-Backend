import { Socket } from "socket.io";
import { GamePlayerObject, GameRoomObject, MatchUpdateObject, PlayerUpdateObject } from "./support/types";

import { allGameRooms, allPlayers } from './support/data';
import * as utility from './support/utility';
import * as Consts from './support/constants';
import { World, Body } from 'p2';

let io: Socket;

let p2WorldInterval: NodeJS.Timeout;
let stateUpdateInterval: NodeJS.Timeout;

function handlePlayerLost(player: GamePlayerObject) {
  player.isAlive = false;
}

function handlePlayerWon(player: GamePlayerObject) {
  console.log(`Player ${player.username} won the match!`);
}

function routine_P2PhysicsStep(gameRoom: GameRoomObject) {
  if (!gameRoom.isMatchStarted) {
    // stops execution when match ends
    clearInterval(p2WorldInterval);
  } else {
    // changes ship velocity using a timer value
    gameRoom.shipVelocityTimerValue++;
    if (gameRoom.shipVelocityTimerValue >= 80) {
      gameRoom.shipVelocityTimerValue = 0;
      gameRoom.shipDynamicBody!.velocity[0] = utility.calculateRandomVelocity(); ;
    }
  
    // process the physics step
    gameRoom.p2World!.step(Consts.PHYSICS_WORLD_TIMESTEP);
  
    // enforce ship bounds
    if (gameRoom.shipDynamicBody!.position[0] > Consts.CANVAS_WIDTH && gameRoom.shipDynamicBody!.velocity[0] > 0) {
      gameRoom.shipDynamicBody!.position[0] = 0;
    } else if (gameRoom.shipDynamicBody!.position[0] < 0 && gameRoom.shipDynamicBody!.velocity[0] < 0) {
      gameRoom.shipDynamicBody!.position[0] = Consts.CANVAS_WIDTH - 32;
    }
  
    // set ship velocity in room state
    gameRoom.currentShipXPosition = gameRoom.shipDynamicBody!.position[0];
  }
}
  
function startDownwardMovement(player: GamePlayerObject) {
  const interval = setInterval(() => {
    if (player.isAlive) {
      player.y += Consts.PLAYER_VERTICAL_INCREMENT;
      player.score += Consts.PLAYER_SCORE_INCREMENT;
      if (player.y > Consts.SHIP_POSITION_Y) {
        handlePlayerWon(player);
        clearInterval(interval);
      }
    } else {
      clearInterval(interval);
    }
  }, Consts.PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL);
}
  
function routine_gameStateUpdate(gameRoom: GameRoomObject) {
  if (!gameRoom.isMatchStarted) {
    // stops execution when match ends
    clearInterval(stateUpdateInterval);
  } else {
    const gameUpdate: MatchUpdateObject = {
      playerUpdates: [],
      shootBullet: ShouldFireBullet(gameRoom),
      shipPositionX : gameRoom.shipDynamicBody!.position[0],
    };
    
    gameRoom.playersInRoom!.forEach(player => {
      const playerUpdate: PlayerUpdateObject = {
        username: player.username,
        x: player.x,
        y: player.y,
        avatarIndex: player.avatarIndex,
        score: player.score,
        isAlive: player.isAlive,
      }
      gameUpdate.playerUpdates.push(playerUpdate);

    });
    
    io.to(gameRoom.id.toString()).emit('game-state', gameUpdate);
  }
}
  
function ShouldFireBullet(gameRoom: GameRoomObject) : boolean {
  let bulletOrBlank = 0;
  gameRoom.bulletShootTimerValue += Consts.GAME_TICKER_MS;
  
  // shoot every 5th update cycle
  if (gameRoom.bulletShootTimerValue >= Consts.GAME_TICKER_MS * 50) {
    gameRoom.bulletShootTimerValue = 0;
    bulletOrBlank = Math.floor(((Math.random() * 2000) + 50) * 1000);
  }
  
  return bulletOrBlank > 0 ? true : false;
}

function startMatch(gameRoom: GameRoomObject) {
  console.log('Starting Match');

  // create p2 physics world
  gameRoom.p2World = new World({ gravity: [0, -9.82] });
    
  // add ship as p2 physics body for velocity calculations
  gameRoom.shipDynamicBody = new Body({
    position: [gameRoom.currentShipXPosition, Consts.SHIP_POSITION_Y],
    velocity: [utility.calculateRandomVelocity(), 0]
  });
  
  // add ship to p2 world
  gameRoom!.p2World!.addBody(gameRoom.shipDynamicBody!);
  
  p2WorldInterval = setInterval(() => routine_P2PhysicsStep(gameRoom), 1000 * Consts.PHYSICS_WORLD_TIMESTEP);
  
  gameRoom.playersInRoom!.forEach((player) => {
    startDownwardMovement(player);
  });

  stateUpdateInterval = setInterval(() => routine_gameStateUpdate(gameRoom), Consts.GAME_TICKER_MS);
}

function handlePlayerInput(player: GamePlayerObject, keyPressed: string) {  
  if (keyPressed === 'left') {
    if (player.x - 20 < 20) {
      player.x = 20;
    } else {
      player.x -= 20;
    }
  } else if (keyPressed === 'right') {
    if (player.x + 20 < 1380) {
      player.x = 1380;
    } else {
      player.x -= 20;
    }
  }
}

function gameplayUpdateLoop(ioInst: Socket) {
  if (io === undefined) {
    io = ioInst;
  }

  allPlayers.forEach((player: GamePlayerObject) => {
    if (!player.registeredGameRoomEvents) {
      player.registeredGameRoomEvents = true;

      // init player
      player.socket.on('player-input', function(keyPressed) {handlePlayerInput(player, keyPressed);});
      player.socket.on('player-lost', function() {handlePlayerLost(player);});
    }
  });

  allGameRooms.forEach((gameRoom: GameRoomObject) => {
    if (!gameRoom.isMatchStarted) {
      gameRoom.isMatchStarted = true;

      // init room
      startMatch(gameRoom);
    }
  });
}

module.exports = {
  gameplayUpdateLoop,
};