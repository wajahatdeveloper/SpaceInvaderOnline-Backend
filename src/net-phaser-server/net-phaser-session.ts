import { Server, Socket } from "socket.io";
import { NetEvent, eventManager } from "./net-phaser-events";
import { SessionData } from "./types";
import { config } from "./net-phaser-config";
import { clientPool, useServer } from "./net-phaser-connection";

let sessions: SessionData[] = [];

function joinSession(playerSocket: Socket, clientId: string)
{
    const openSessions = sessions.filter((value, index, array)=>{
        return value.clients.length < config.maxPlayersInSession;
    });

    let useSession: SessionData;

    if (openSessions.length <= 0) {
        // create new session
        useSession = {
            id: (Math.floor(Math.random() * 100) + 1).toString(),
            clients: [],
        };
        sessions.push(useSession);
    } else {
        // use existing session
        useSession = openSessions[0];
    }

    let client = clientPool.get(clientId)!;
    client.sessionId = useSession.id;
    useSession.clients.push(client);

    console.log(`client ${clientId} joined session ${useSession.id}`);
    

    playerSocket.emit('sessionJoined', useSession.id);
}

function leaveSession(playerSocket: Socket, clientId: string)
{
    let session: SessionData = sessions.find((s)=>{
        s.clients.find(x=>x.id === clientId)
    })!;
    
    removeClientFromSession(session, clientId);

    // notify remaining clients
    session.clients.forEach(c=>{
        let client = clientPool.get(c.id)!;
        client.socket.emit('playerLeftSession', clientId);
    });
}

function removeClientFromSession(session: SessionData, clientId: string) {
    session.clients = session.clients.filter(x=>x.id !== clientId);
}

export {
    joinSession,
    leaveSession,
}