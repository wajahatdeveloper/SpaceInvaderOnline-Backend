import { Server } from "socket.io";
import { NetEvent, eventManager } from ".";

function sendDataToAll(socketServer: Server, clientId: string, sessionId: string, data: any) {
    console.log(`dataSentToAll from ${clientId}, data: ${JSON.stringify(data)}`);
    
    const fromClientId = clientId;
    socketServer.to(sessionId).emit("receiveData", fromClientId, data);
    eventManager.triggerCallback(NetEvent.OnDataSent, data)
}

export {
    sendDataToAll,
}