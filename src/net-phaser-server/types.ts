import { Socket } from "socket.io";

export interface ClientData
{
    id: string;
    sessionId: string;
    socket: Socket;
}

export interface SessionData
{
    id: string;
    clients: ClientData[];
}