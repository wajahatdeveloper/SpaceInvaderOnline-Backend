/* eslint-disable prefer-const */

const defaultGameRoomObject = {
  id: 0,
  bulletShootTimer : 0,
  p2World : undefined,
  shipDynamicBody : undefined,
  shipVelocityTimer : 0,
  isMatchStarted: false,
  playersInRoom: [],
  shipPositionX: 0,
};

const defaultGameUpdateObject = {
  bulletState: {},
  shipPositionX: 0,
  playerUpdates: [],
};

const defaultPlayerUpdateObject = {
  username: '',
  x: 0,
  y: 0,
  avatarIndex: 0,
  score: 0,
  isAlive: true,
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
  registeredGameRoomEvents: false,
};

const allPlayers = new Map();
const gameRooms = new Map();

let currentGameRoomId = 0;

function deleteRoom(roomId) {
  gameRooms.delete(roomId);
}

module.exports = {
  defaultPlayerObject,
  allPlayers,
  defaultGameRoomObject,
  gameRooms,
  currentGameRoomId,
  deleteRoom,
  defaultPlayerUpdateObject,
  defaultGameUpdateObject,
};