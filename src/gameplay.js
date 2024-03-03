const { gameRooms, allPlayers, defaultPlayerUpdateObject, defaultGameUpdateObject } = require('./support/data');
const utility = require('./support/utility');
const Consts = require('./support/constants');
const { World, Body } = require('p2');

let io = undefined;

let p2WorldInterval;
let stateUpdateInterval;

function handlePlayerLost(player) {
  player.isAlive = false;
}

function handlePlayerWon(player) {
  console.log(`Player ${player.username} won the match!`);
}

function routine_P2PhysicsStep(gameRoom) {
  if (!gameRoom.isMatchStarted) {
    // stops execution when match ends
    clearInterval(p2WorldInterval);
  } else {
    // changes ship velocity using a timer value
    gameRoom.shipVelocityTimer++;
    if (gameRoom.shipVelocityTimer >= 80) {
      gameRoom.shipVelocityTimer = 0;
      gameRoom.shipDynamicBody.velocity[0] = utility.calculateRandomVelocity(); ;
    }
  
    // process the physics step
    gameRoom.p2World.step(Consts.PHYSICS_WORLD_TIMESTEP);
  
    // enforce ship bounds
    if (gameRoom.shipDynamicBody.position[0] > Consts.CANVAS_WIDTH && gameRoom.shipDynamicBody.velocity[0] > 0) {
      gameRoom.shipDynamicBody.position[0] = 0;
    } else if (gameRoom.shipDynamicBody.position[0] < 0 && gameRoom.shipDynamicBody.velocity[0] < 0) {
      gameRoom.shipDynamicBody.position[0] = Consts.CANVAS_WIDTH - 32;
    }
  
    // set ship velocity in room state
    gameRoom.shipPositionX = gameRoom.shipDynamicBody.position[0];
  }
}
  
function startDownwardMovement(player) {
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
  
function routine_gameStateUpdate(gameRoom) {
  if (!gameRoom.isMatchStarted) {
    // stops execution when match ends
    clearInterval(stateUpdateInterval);
  } else {
    const gameUpdate = {
      ...defaultGameUpdateObject,
      bulletState : GenerateBulletState(gameRoom),
      shipPositionX : gameRoom.shipDynamicBody.position[0],
      isGameOn: true,
    };
    
    gameRoom.playersInRoom.forEach(player => {
      gameUpdate.playerUpdates.push({
        ...defaultPlayerUpdateObject,
        username: player.username,
        x: player.x,
        y: player.y,
        avatarIndex: player.avatarIndex,
        score: player.score,
        isAlive: player.isAlive
      });

    });
    
    io.to(gameRoom.id).emit('game-state', gameUpdate);
  }
}
  
function GenerateBulletState(gameRoom) {
  let bulletOrBlank = 0;
  gameRoom.bulletShootTimer += Consts.GAME_TICKER_MS;
  
  // shoot every 5th update cycle
  if (gameRoom.bulletShootTimer >= Consts.GAME_TICKER_MS * 50) {
    gameRoom.bulletShootTimer = 0;
    bulletOrBlank = Math.floor(((Math.random() * 2000) + 50) * 1000);
  }
  
  return bulletOrBlank;
}

function startMatch(gameRoom) {
  console.log('Starting Match');

  // create p2 physics world
  gameRoom.p2World = new World({ gravity: [0, -9.82] });
    
  // add ship as p2 physics body for velocity calculations
  gameRoom.shipDynamicBody = new Body({
    position: [gameRoom.shipPositionX, Consts.SHIP_POSITION_Y],
    velocity: [utility.calculateRandomVelocity(), 0]
  });
  
  // add ship to p2 world
  gameRoom.p2World.addBody(gameRoom.shipDynamicBody);
  
  p2WorldInterval = setInterval(() => routine_P2PhysicsStep(gameRoom), 1000 * Consts.PHYSICS_WORLD_TIMESTEP);
  
  gameRoom.playersInRoom.forEach((player) => {
    startDownwardMovement(player);
  });

  stateUpdateInterval = setInterval(() => routine_gameStateUpdate(gameRoom), Consts.GAME_TICKER_MS);
}

function handlePlayerInput(player, keyPressed) {  
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

function gameplayUpdateLoop(ioInst) {
  if (io === undefined) {
    io = ioInst;
  }

  allPlayers.forEach((player) => {
    if (!player.registeredGameRoomEvents) {
      player.registeredGameRoomEvents = true;

      // init player
      player.socket.on('player-input', function(keyPressed) {handlePlayerInput(player, keyPressed);});
      player.socket.on('player-lost', function() {handlePlayerLost(player);});
    }
  });

  gameRooms.forEach((gameRoom) => {
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