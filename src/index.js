const express = require('express');
const httpServer = require('http');
const socketIO = require('socket.io');
const { ServerConfig } = require('./config');
const apiRoutes = require('./routes');
const cors = require('cors');

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
});

io.on('connection_error', (err) => {
  console.log(err.req);      // the request object
  console.log(err.code);     // the error code, for example 1
  console.log(err.message);  // the error message, for example "Session ID unknown"
  console.log(err.context);  // some additional error context
});

http.listen(ServerConfig.PORT, () => {
  console.log(`Successfully started the server on PORT : ${ServerConfig.PORT}`);
});