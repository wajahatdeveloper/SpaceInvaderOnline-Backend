import { Server, Socket } from "socket.io";
import { NetEvent, eventManager } from ".";

function sendDataToAll(playerSocket: Socket, socketServer: Server, clientId: string, sessionId: string, data: any) {
    socketServer.to(sessionId).emit("receiveData", {clientId, data});
    eventManager.triggerCallback(NetEvent.OnDataSent, {playerSocket, data})
}

function receiveData(fromClientId: string, data: any) {
    eventManager.triggerCallback(NetEvent.OnDataReceived, {fromClientId, data});
}

export {
    sendDataToAll,
    receiveData,
}