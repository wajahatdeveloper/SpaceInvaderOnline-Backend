import { Socket } from "socket.io";

export interface ClientData
{
    id: string;
    sessionId: string;
    socket: Socket;
    reconnectionInterval: NodeJS.Timeout | undefined;
}

export interface SessionData
{
    id: string;
    clients: ClientData[];
}