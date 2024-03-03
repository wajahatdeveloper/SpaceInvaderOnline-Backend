const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const httpServer = require('http');
const socketIO = require('socket.io');
const Consts = require('./support/constants');
const { registerConnectionEvents } = require('./connections');
const { gameplayUpdateLoop } = require('./gameplay');

dotenv.config();
const app = express();

app.use(cors());

const http = httpServer.createServer(app);
const io = socketIO(http);

io.on('connection', (socket) => {
  registerConnectionEvents(socket, io);
});

http.listen(Consts.PORT, () => {
  console.log(`Successfully started server on PORT : ${Consts.PORT}`);
});

setInterval(() => {
  gameplayUpdateLoop(io);
}, 50);