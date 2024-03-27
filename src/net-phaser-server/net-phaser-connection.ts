import { Server, Socket } from "socket.io";
import { NetEvent, eventManager } from "./net-phaser-events";

interface ClientData
{
    isInRoom: boolean;
}

const clientPool: Map<string, ClientData> = new Map(); // clientId, clientData

function useServer(socketServer: Server) {
  socketServer.on("connection", (playerSocket: Socket) => {
    console.log(`New Player Connected with Socket ID : ${playerSocket.id}`);
    eventManager.triggerCallback(NetEvent.OnPlayerConnected, playerSocket);
    let clientId = playerSocket.handshake.query.clientId?.toString()!;
    clientPool.set(clientId, { isInRoom: false });

    playerSocket.on("disconnect", (data: any) => {
      console.log(`Player Disconnected with Socket ID : ${playerSocket.id}`);
      eventManager.triggerCallback(NetEvent.OnPlayerConnected, playerSocket);
      clientPool.delete(clientId);
    });
  });
}

export { useServer };