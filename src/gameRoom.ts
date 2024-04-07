import p2, { Body, World } from "p2";
import { GamePlayer } from "./gamePlayer";
import { Server } from "socket.io";
import {
  CANVAS_WIDTH,
  GAME_TICKER_MS,
  INBOUND_MATCH_EVENT_PLAYER_INPUT,
  INBOUND_MATCH_EVENT_PLAYER_LOST,
  OUTBOUND_MATCH_EVENT_MATCH_INITAL,
  OUTBOUND_MATCH_EVENT_MATCH_UPDATE,
  OUTBOUND_MATCH_EVENT_PLAYER_LOST,
  OUTBOUND_MATCH_EVENT_PLAYER_WON,
  PHYSICS_WORLD_TIMESTEP,
  PLAYER_SCORE_INCREMENT,
  PLAYER_VERTICAL_INCREMENT,
  PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL,
  SHIP_POSITION_Y,
} from "./support/constants";
import { calculateRandomVelocity } from "./support/utility";
import { MatchInitalObject, MatchUpdateObject, PlayerInitalObject, PlayerUpdateObject } from "./support/types";
import { sendDataToAll } from "./net-phaser-server/net-phaser-session-sync";

export class GameRoom {
  static allGameRooms: Map<string, GameRoom> = new Map(); // key = roomId

  playersInRoom: GamePlayer[] = new Array<GamePlayer>();

  roomId: string = "";
  isMatchStarted: boolean = false;

  bulletShootTimerValue: number = 0;
  shipVelocityTimerValue: number = 0;
  currentShipXPosition: number = 0;

  p2World: p2.World | undefined;
  shipDynamicBody: p2.Body | undefined;

  p2WorldInterval: NodeJS.Timeout | undefined;
  stateUpdateInterval: NodeJS.Timeout | undefined;

  socketIO: Server;

  constructor(socketIOInst: Server, roomId: string) {
    this.roomId = roomId;
    this.socketIO = socketIOInst;
    console.log(`GameRoom [${this.roomId}]: New GameRoom Instantiated`);
  }

  startMatch() {
    console.log(`GameRoom [${this.roomId}]: Starting Match`);

    this.p2World = new World({ gravity: [0, -9.82] });
    this.p2WorldInterval = setInterval(
      () => this.routine_P2PhysicsStep(),
      1000 * PHYSICS_WORLD_TIMESTEP
    );
    this.stateUpdateInterval = setInterval(
      () => this.routine_gameStateUpdate(),
      GAME_TICKER_MS
    );

    this.shipDynamicBody = new Body({
      position: [this.currentShipXPosition, SHIP_POSITION_Y],
      velocity: [calculateRandomVelocity(), 0],
    });

    this.p2World!.addBody(this.shipDynamicBody!);

    const initalUpdate: MatchInitalObject = {
      playerInitals: []
    };

    this.playersInRoom!.forEach((player) => {
      
      player.socket.on(INBOUND_MATCH_EVENT_PLAYER_INPUT, (keyPressed) => {
        this.handlePlayerInput(player, keyPressed);
      });
      
      player.socket.on(INBOUND_MATCH_EVENT_PLAYER_LOST, () => {
        this.handlePlayerLost(player);
      });
      
      this.startDownwardMovement(player);

      const playerInitial: PlayerInitalObject = {
        avatarIndex: 0, username: player.clientId
      };
      
      initalUpdate.playerInitals.push(playerInitial);
    });

    this.socketIO.to(this.roomId).emit(OUTBOUND_MATCH_EVENT_MATCH_INITAL, initalUpdate);

    this.isMatchStarted = true;
  }

  delete(): void {
    clearInterval(this.p2WorldInterval);
    clearInterval(this.stateUpdateInterval);
    GameRoom.allGameRooms.delete(this.roomId);
  }

  startDownwardMovement(player: GamePlayer) {
    const interval = setInterval(() => {
      if (player.isAlive) {
        player.y += PLAYER_VERTICAL_INCREMENT;
        player.score += PLAYER_SCORE_INCREMENT;
        if (player.y > SHIP_POSITION_Y) {
          this.handlePlayerWon(player);
          this.delete();
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    }, PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL);
  }

  handlePlayerWon(player: GamePlayer) {
    this.isMatchStarted = false;
    this.socketIO.to(this.roomId).emit(OUTBOUND_MATCH_EVENT_PLAYER_WON, {
      winnerId: player.clientId
    });
    console.log(
      `GameRoom [${this.roomId}]: Player ${player.clientId} won the match!`
    );
  }

  handlePlayerLost(player: GamePlayer) {
    this.socketIO.to(this.roomId).emit(OUTBOUND_MATCH_EVENT_PLAYER_LOST, {
      loserId: player.clientId
    });    console.log(
      `GameRoom [${this.roomId}]: Player ${player.clientId} lost the match!`
    );
  }

  handlePlayerInput(player: GamePlayer, keyPressed: string) {
    if (keyPressed === "left") {
      if (player.x - 20 < 20) {
        player.x = 20;
      } else {
        player.x -= 20;
      }
    } else if (keyPressed === "right") {
      if (player.x + 20 < 1380) {
        player.x = 1380;
      } else {
        player.x -= 20;
      }
    }
  }

  routine_P2PhysicsStep() {
    // changes ship velocity using a timer value
    this.shipVelocityTimerValue++;
    if (this.shipVelocityTimerValue >= 80) {
      this.shipVelocityTimerValue = 0;
      this.shipDynamicBody!.velocity[0] = calculateRandomVelocity();
    }

    // process the physics step
    this.p2World!.step(PHYSICS_WORLD_TIMESTEP);

    // enforce ship bounds
    if (
      this.shipDynamicBody!.position[0] > CANVAS_WIDTH &&
      this.shipDynamicBody!.velocity[0] > 0
    ) {
      this.shipDynamicBody!.position[0] = 0;
    } else if (
      this.shipDynamicBody!.position[0] < 0 &&
      this.shipDynamicBody!.velocity[0] < 0
    ) {
      this.shipDynamicBody!.position[0] = CANVAS_WIDTH - 32;
    }

    // set ship velocity in room state
    this.currentShipXPosition = this.shipDynamicBody!.position[0];
  }

  routine_gameStateUpdate() {
    const gameUpdate: MatchUpdateObject = {
      playerUpdates: [],
      shootBullet: this.ShouldFireBullet(),
      shipPositionX: this.shipDynamicBody!.position[0],
    };
    this.playersInRoom!.forEach((player) => {
      const playerUpdate: PlayerUpdateObject = {
        x: player.x,
        y: player.y,
        score: player.score,
        isAlive: player.isAlive,
      };
      gameUpdate.playerUpdates.push(playerUpdate);
    });
    this.socketIO.to(this.roomId).emit(OUTBOUND_MATCH_EVENT_MATCH_UPDATE, gameUpdate);

    // check player count is valid
    if (this.playersInRoom?.length <= 1) {
      // give the last remaining player the win, and close the room
      const player = this.playersInRoom[0];
      this.handlePlayerWon(player);
      console.log(`GameRoom [${this.roomId}]: Destroyed`);
      this.delete();
    }
  }

  ShouldFireBullet(): boolean {
    let bulletOrBlank = 0;
    this.bulletShootTimerValue += GAME_TICKER_MS;

    // shoot every 5th update cycle
    if (this.bulletShootTimerValue >= GAME_TICKER_MS * 50) {
      this.bulletShootTimerValue = 0;
      bulletOrBlank = Math.floor((Math.random() * 2000 + 50) * 1000);
    }

    return bulletOrBlank > 0 ? true : false;
  }
}
