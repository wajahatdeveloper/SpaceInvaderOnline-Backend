import { Server, Socket } from "socket.io";
import { NetEvent, eventManager } from ".";

function sendDataToAll(playerSocket: Socket, socketServer: Server, clientId: string, sessionId: string, data: any) {
    console.log(`dataSentToAll from ${clientId}, data: ${JSON.stringify(data)}`);
    
    const fromClientId = clientId;
    socketServer.to(sessionId).emit("receiveData", fromClientId, data);
    eventManager.triggerCallback(NetEvent.OnDataSent, {playerSocket, data})
}

function receiveData(fromClientId: string, data: any) {
    eventManager.triggerCallback(NetEvent.OnDataReceived, {fromClientId, data});

    console.log(`receivedData from ${fromClientId}, data: ${JSON.stringify(data)}`);
}

export {
    sendDataToAll,
    receiveData,
}