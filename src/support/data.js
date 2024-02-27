/* eslint-disable prefer-const */

const defaultGameRoomObject = {
  id: 0,
  bulletShootTimer : 0,
  p2World : undefined,
  shipDynamicBody : undefined,
  shipVelocityTimer : 0,
  isMatchStarted: false,
  playerCount: 0,
  shipPositionX: 0,
  bulletState: {},
  players: [],
};

const defaultPlayerObject = {
  clientId: '',
  username: '',
  x: 0,
  y: 0,
  avatarIndex: 0,
  score: 0,
  isAlive: true,
  gameRoomId: 0,
  socket: undefined,
};

const allPlayers = new Map();
const playersInLobby = [];
const gameRooms = new Map();

let currentGameRoomId = 0;

function deleteRoom(roomId) {
  gameRooms.delete(roomId);
}

module.exports = {
  defaultPlayerObject,
  allPlayers,
  playersInLobby,
  defaultGameRoomObject,
  gameRooms,
  currentGameRoomId,
  deleteRoom,
};