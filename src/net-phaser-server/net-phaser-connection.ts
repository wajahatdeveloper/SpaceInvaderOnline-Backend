import { Server, Socket } from "socket.io";
import { NetEvent, eventManager } from "./net-phaser-events";
import { ClientData } from "./types";
import { NetPhaserConfig, setConfig } from "./net-phaser-config";
import { joinSession, leaveSession } from "./net-phaser-session";
import { sendDataToAll } from "./net-phaser-session-sync";

const clientPool: Map<string, ClientData> = new Map(); // clientId, clientData

function useServer(socketServer: Server, config: NetPhaserConfig) {

  setConfig(config);

  socketServer.on("connection", (playerSocket: Socket) => {
    eventManager.triggerCallback(NetEvent.OnPlayerConnected, playerSocket);
    let clientId = playerSocket.handshake.query.clientId?.toString()!;
    clientPool.set(clientId, { id: clientId, sessionId: '', socket: playerSocket });
    console.log(`New Player Connected with Socket ID : ${playerSocket.id} & Client ID : ${clientId}`);

    playerSocket.on("disconnect", (data: any) => {
      console.log(`Player Disconnected with Socket ID : ${playerSocket.id}`);
      eventManager.triggerCallback(NetEvent.OnPlayerDisconnected, playerSocket);
      clientPool.delete(clientId);
    });

    playerSocket.on("joinSession", () => joinSession(playerSocket, clientId));
    playerSocket.on("leaveSession", () => leaveSession(playerSocket, clientId));
    playerSocket.on("sendDataToAll", (sessionId, data) => sendDataToAll(playerSocket, socketServer, clientId, sessionId, data));
  });
}

export { useServer, clientPool };