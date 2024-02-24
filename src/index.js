const express = require('express');
const httpServer = require('http');
const socketIO = require('socket.io');
const { ServerConfig } = require('./config');
const apiRoutes = require('./routes');
const cors = require('cors');
const { World, Body } = require('p2');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/api', apiRoutes);

const http = httpServer.createServer(app);
const socketIO_Options = {};
const io = socketIO(http, socketIO_Options);

io.on('connection', socket => {
  const connectedPlayerCount = io.engine.clientsCount;
  console.log(`New Player Connected with ID : ${socket.id} , TotalPlayersCount: ${connectedPlayerCount}`);
  
  socket.on('enter', data => handlePlayerEnterRoom(socket, data));
  socket.on('leave', data => handlePlayerLeaveRoom(socket, data));
  socket.on('player-lost', data => handlePlayerLost(socket, data));
});

io.on('disconnect', (err) => {
  console.log(err);
});

http.listen(ServerConfig.PORT, () => {
  console.log(`Successfully started the server on PORT : ${ServerConfig.PORT}`);
});

//----------------------------------------------------------

const gameRoom = 'game-room';
const GAME_TICKER_MS = 100;
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 750;
const SHIP_POSITION_Y = CANVAS_HEIGHT - 32;
const BULLET_SHOOT_POS_Y = SHIP_POSITION_Y;
const MIN_PLAYERS_TO_START_MATCH = 2;
const PHYSICS_WORLD_TIMESTEP = 1 / 16;
const PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL = 1000;
const PLAYER_VERTICAL_INCREMENT = 20;
const PLAYER_SCORE_INCREMENT = 5;

let totalPlayersInRoom = 0;
let isMatchStarted = false;
let tickInterval = undefined;
let bulletShootTimer = 0;
let physicsWorld = undefined;
let shipDynamicBody = undefined;
let shipPositionX = 0;
let shipVelocityTimer = 0;
const players = [];

// requires 'clientId' from client side
function handlePlayerEnterRoom(socket, player) {
  socket.join(gameRoom);
  console.log(`Player Entered Room : ${gameRoom} with ID : ${player.id}`);
  totalPlayersInRoom++;

  players[player.clientId] = {
    id: player.clientId,
    x: getRandomXPosition(),
    y: 20,  // start from top
    avatarIndex: getRandomAvatarIndex(),
    score: 0,
    isAlive: true,
  };

  if (totalPlayersInRoom === MIN_PLAYERS_TO_START_MATCH) {
    startMatch();
  }

  subscribeToPlayerInput(socket, player.clientId);
}

function handlePlayerLeaveRoom(socket, player) {
  console.log(`Player Left Room with ID : ${player.id}`);
  totalPlayersInRoom--;
  const index = players.indexOf(player);
  if (index !== -1) {
    players.splice(index, 1);
  }
  if (totalPlayersInRoom <= 0) {
    resetServerState();
  }
}

function handlePlayerLost(socket, player) {
  player.isAlive = false;
}

function startMatch() {
  console.log('Starting Match');
  isMatchStarted = true;
  
  physicsWorld = new World({ gravity: [0, -9.82] });
  shipDynamicBody = new Body({position: [shipPositionX, SHIP_POSITION_Y],
    velocity: [calculateRandomVelocity(), 0]});
  physicsWorld.addBody(shipDynamicBody);

  const physicsWorldInterval = setInterval(() => {
    if (!isMatchStarted) {
      clearInterval(physicsWorldInterval);
    } else {
      // updates velocity every 5 seconds
      shipVelocityTimer++;
      if (shipVelocityTimer >= 80) {
        shipVelocityTimer = 0;
        shipDynamicBody.velocity[0] = calculateRandomVelocity(); ;
      }
      physicsWorld.step(PHYSICS_WORLD_TIMESTEP);
      if (shipDynamicBody.position[0] > CANVAS_WIDTH && shipDynamicBody.velocity[0] > 0) {
        shipDynamicBody.position[0] = 0;
      } else if (shipDynamicBody.position[0] < 0 && shipDynamicBody.velocity[0] < 0) {
        shipDynamicBody.position[0] = CANVAS_WIDTH;
      }
      shipPositionX = shipDynamicBody.position[0];
    }
  }, 1000 * PHYSICS_WORLD_TIMESTEP);

  players.forEach(player => {
    startDownwardMovement(player);
  });

  tickInterval = setInterval(GenerateGameStateUpdate, GAME_TICKER_MS);
}

function startDownwardMovement(player) {
  const interval = setInterval(() => {
    if (player.isAlive) {
      player.y += PLAYER_VERTICAL_INCREMENT;
      player.score += PLAYER_SCORE_INCREMENT;
      if (player.y > SHIP_POSITION_Y) {
        finishMatch(player);
        clearInterval(interval);
      }
    } else {
      clearInterval(interval);
    }
  }, PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL);
}

function finishMatch(player) {
  io.to(gameRoom).emit('game-over', player);
  resetServerState();
}

function resetServerState() {
  isMatchStarted = false;
  //TODO: RESET GAME STATE
}

function GenerateGameStateUpdate() {
  if (!isMatchStarted) {
    clearInterval(tickInterval);
  } else {
    const bulletState = GenerateBulletState();
    io.to(gameRoom).emit('game-state', {
      bulletState,
      shipPositionX,
      isMatchStarted
    });
  }
}

function GenerateBulletState() {
  let bulletOrBlank = {};
  bulletShootTimer += GAME_TICKER_MS;
  // shoot every 5th update cycle
  if (bulletShootTimer >= GAME_TICKER_MS * 5) {
    bulletShootTimer = 0;
    bulletOrBlank = {
      id: Math.floor(((Math.random() * 2000) + 50) * 1000) / 1000,
      y: BULLET_SHOOT_POS_Y,
    };
  }
  return bulletOrBlank;
}

function getRandomXPosition() {
  return Math.floor(((Math.random() * 1370) + 30) * 1000) / 1000;
}

function getRandomAvatarIndex() {
  return Math.floor(Math.random() * 3);
}

function subscribeToPlayerInput(socket, playerClientId) {
  socket.on('pos', msg => {
    if (msg.data.keyPressed === 'left') {
      if (players[playerClientId].x - 20 < 20) {
        players[playerClientId].x = 20;
      } else {
        players[playerClientId].x -= 20;
      }
    } else if (msg.data.keyPressed === 'right') {
      if (players[playerClientId].x + 20 < 1380) {
        players[playerClientId].x = 1380;
      } else {
        players[playerClientId].x -= 20;
      }
    }
  });
}

function calculateRandomVelocity() {
  let randomShipXVelocity = Math.floor(Math.random() * 200) + 20;
  randomShipXVelocity *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
  return randomShipXVelocity;
}