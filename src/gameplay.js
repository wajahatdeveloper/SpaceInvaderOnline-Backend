const utility = require('./support/utility');
const { World, Body } = require('p2');

let p2WorldInterval;
let stateUpdateInterval;


function handlePlayerInput(socket, payload) {
  const username = payload.username;
  const user = data.players.filter(x => x.username === username);
  if (!user) return;
  
  if (payload.keyPressed === 'left') {
    if (user.x - 20 < 20) {
      user.x = 20;
    } else {
      user.x -= 20;
    }
  } else if (payload.keyPressed === 'right') {
    if (user.x + 20 < 1380) {
      user.x = 1380;
    } else {
      user.x -= 20;
    }
  }
}

function handlePlayerLost(socket, player) {
  player.isAlive = false;
}


function finishMatch(player) {
  // io.to(gameRoom).emit('game-over', player);
  resetServerState();
}

function startMatch(socket) {

  console.log('Starting Match');
    
  data.isMatchStarted = true;
    
  // create p2 physics world
  data.p2World = new World({ gravity: [0, -9.82] });
    
  // add ship as p2 physics body for velocity calculations
  data.shipDynamicBody = new Body({
    position: [data.shipPositionX, Globals.SHIP_POSITION_Y],
    velocity: [utility.calculateRandomVelocity(), 0]
  });
  
  // add ship to p2 world
  data.p2World.addBody(data.shipDynamicBody);
  
  p2WorldInterval = setInterval(p2PhysicsStep, 1000 * Globals.PHYSICS_WORLD_TIMESTEP);
  
  data.players.forEach((player) => {
    startDownwardMovement(player);
  });
  
  io.to(Globals.GAME_ROOM).emit('game-start');
  
  stateUpdateInterval = setInterval(GenerateGameStateUpdate, Globals.GAME_TICKER_MS);
  
  socket.on('player-lost', data => handlePlayerLost(socket, data));
  socket.on('player-input', data => handlePlayerInput(socket, data));
}
  
function p2PhysicsStep() {
  if (!data.isMatchStarted) {
    // stops execution when match ends
    clearInterval(p2WorldInterval);
  } else {
    // changes ship velocity using a timer value
    data.shipVelocityTimer++;
    if (data.shipVelocityTimer >= 80) {
      data.shipVelocityTimer = 0;
      data.shipDynamicBody.velocity[0] = utility.calculateRandomVelocity(); ;
    }
  
    // process the physics step
    data.p2World.step(Globals.PHYSICS_WORLD_TIMESTEP);
  
    // enforce ship bounds
    if (data.shipDynamicBody.position[0] > Globals.CANVAS_WIDTH && data.shipDynamicBody.velocity[0] > 0) {
      data.shipDynamicBody.position[0] = 0;
    } else if (data.shipDynamicBody.position[0] < 0 && data.shipDynamicBody.velocity[0] < 0) {
      data.shipDynamicBody.position[0] = Globals.CANVAS_WIDTH - 32;
    }
  
    // set ship velocity in room state
    data.gameRoom.shipPositionX = data.shipDynamicBody.position[0];
  }
}
  
function startDownwardMovement(player) {
  const interval = setInterval(() => {
    if (player.isAlive) {
      player.y += Globals.PLAYER_VERTICAL_INCREMENT;
      player.score += Globals.PLAYER_SCORE_INCREMENT;
      if (player.y > Globals.SHIP_POSITION_Y) {
        // finishMatch(player);
        clearInterval(interval);
      }
    } else {
      clearInterval(interval);
    }
  }, Globals.PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL);
}
  
function GenerateGameStateUpdate() {
  if (!data.isMatchStarted) {
    // stops execution when match ends
    clearInterval(stateUpdateInterval);
  } else {
    data.gameRoom.bulletState = GenerateBulletState();
    data.gameRoom.shipPositionX = data.shipDynamicBody.position[0];
  
    data.players.splice(0, data.players.length);
    data.players.forEach(player => {
  
      data.gameRoom.players.push({
        username: player.username,
        x: player.x,
        y: player.y,
        avatarIndex: player.avatarIndex,
        score: player.score,
        isAlive: player.isAlive
      });
  
    });
  
    io.to(Globals.GAME_ROOM).emit('game-state', data.gameRoom);
  }
}
  
function GenerateBulletState() {
  let bulletOrBlank = 0;
  data.bulletShootTimer += Globals.GAME_TICKER_MS;
  
  // shoot every 5th update cycle
  if (data.bulletShootTimer >= Globals.GAME_TICKER_MS * 50) {
    data.bulletShootTimer = 0;
    bulletOrBlank = Math.floor(((Math.random() * 2000) + 50) * 1000);
  }
  
  return bulletOrBlank;
}