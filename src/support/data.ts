/* eslint-disable prefer-const */

import { GamePlayerObject, GameRoomObject } from "./types";

const allPlayers: Map<string, GamePlayerObject> = new Map();
const allGameRooms: Map<number, GameRoomObject> = new Map();

let currentGameRoomId: number = 0;

function deleteRoom(roomId: number) {
  allGameRooms.delete(roomId);
}

export {
  allPlayers,
  allGameRooms,
  currentGameRoomId,
  deleteRoom,
};