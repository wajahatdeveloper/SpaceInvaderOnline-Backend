import { Server, Socket } from "socket.io";
import { NetEvent, eventManager } from "./net-phaser-events";
import { ClientData } from "./types";
import { NetPhaserConfig, setConfig } from "./net-phaser-config";
import { joinSession, leaveSession } from "./net-phaser-session";
import { sendDataToAll } from "./net-phaser-session-sync";

const clientPool: Map<string, ClientData> = new Map(); // clientId, clientData
const RECONNECTION_GRACE_INTERVAL = 10000;

function useServer(socketServer: Server, config: NetPhaserConfig) {
  setConfig(config);

  socketServer.on("connection", (playerSocket: Socket) => {
    let clientId = playerSocket.handshake.query.clientId?.toString()!;

    if (clientPool.has(clientId)) {
      // player is reconnecting
      const client = clientPool.get(clientId)!;
      clearInterval(client.reconnectionInterval);
      console.log(
        `Player Reconnected with Socket ID : ${playerSocket.id} & Client ID : ${clientId}`
      );
    } else {
      // player is new joinee
      clientPool.set(clientId, {
        id: clientId,
        sessionId: "",
        socket: playerSocket,
        reconnectionInterval: undefined,
      });
      console.log(
        `New Player Connected with Socket ID : ${playerSocket.id} & Client ID : ${clientId}`
      );
    }

    eventManager.triggerCallback(
      NetEvent.OnPlayerConnected,
      clientPool.get(clientId)
    );

    playerSocket.on("disconnect", (data: any) => {
      const client = clientPool.get(clientId)!;
      eventManager.triggerCallback(NetEvent.OnPlayerDisconnected, client);

      if (client.sessionId !== "") {
        console.log(`Player with Socket ID : ${playerSocket.id} Disconnected While in Session ${client.sessionId}`);
        // player was already in session start reconnection grace period timeout
        client.reconnectionInterval = setTimeout(() => {
          // player was unable to reconnect during grace period
          clearInterval(client.reconnectionInterval);
          console.log(`Player Disconnected with Socket ID : ${playerSocket.id}`);
          clientPool.delete(clientId);
        }, RECONNECTION_GRACE_INTERVAL);
      } else {
        // player was not in session (can disconnect safely)
        clientPool.delete(clientId);
        console.log(`Player Disconnected with Socket ID : ${playerSocket.id}`);    
      }
    });

    playerSocket.on("joinSession", () => joinSession(playerSocket, clientId));
    playerSocket.on("leaveSession", () => leaveSession(playerSocket, clientId));
    playerSocket.on("sendDataToAll", (sessionId, data) =>
      sendDataToAll(playerSocket, socketServer, clientId, sessionId, data)
    );
  });
}

function getClientData(clientId: string) {
  return clientPool.get(clientId);
}

export { useServer, getClientData, clientPool };
