const serverData = require('./support/data');
const utility = require('./support/utility');

let io = undefined;

function listenForRoomRequest(socket, ioInst) {
  io = ioInst;
  socket.on('request-room', data => arrangeRoom(data, socket));
}

function arrangeRoom(data, socket) {
  // register player
  socket.on('enter-room', data => onPlayerEnterRoom(socket, data));
  socket.on('leave-room', data => onPlayerLeaveRoom(socket, data));
  //* serverData.allPlayers.set(data.username, {...serverData.defaultPlayerObject, username: data.username, clientId: data.clientId});

  // check if an existing player is waiting for room
  const openPlayers = [];
  serverData.allPlayers.forEach(player => {if (player.gameRoomId === 0) openPlayers.push(player);});
  if (openPlayers.length > 1) {
    // at least two players are available for match making
    // create a new game room and assign these players together
    const p1 = openPlayers[0];
    const p2 = openPlayers[1];
    const roomId = createNewRoom();

    p1.gameRoomId = roomId;
    p2.gameRoomId = roomId;

    p1.socket.join(roomId);
    p2.socket.join(roomId);

    setTimeout(function() {
      io.to(roomId).emit('joined-room', { roomId });

      setTimeout(function() {
        io.to(roomId).emit('start-game');
      }, 1000);

    }, 500);
  } else {
    // there are no additional players waiting, that means this is the only player
    // wait for more players to connect for pairing
  }
}

function createNewRoom() {
  const roomId = ++serverData.currentGameRoomId;
  serverData.gameRooms.set(roomId, {...serverData.defaultGameRoomObject, id: roomId});
  return roomId;
}

function onPlayerEnterRoom(socket, player) {
  console.log(`Player with ID : ${player.clientId} and Username: ${player.username} has Entered Room : ${player.gameRoomId} `);

  const gameRoom = serverData.gameRooms.get(player.gameRoomId);
  gameRoom.playerCount++;

  // add player data to room
  gameRoom.players.push({
    username: player.username,
    x: utility.getRandomXPosition(),
    y: 20,  // start from top
    avatarIndex: utility.getRandomAvatarIndex(),
    score: 0,
    isAlive: true
  });
}

function onPlayerLeaveRoom(socket, player) {
  console.log(`Player with ID : ${player.clientId} and Username: ${player.username} has Left Room : ${player.gameRoomId} `);
  
  const gameRoom = serverData.gameRooms.get(player.gameRoomId);
  gameRoom.playerCount--;

  if (gameRoom.playerCount <= 0) {
    serverData.deleteRoom(gameRoom.id);
  }
}

module.exports = {
  listenForRoomRequest,
};