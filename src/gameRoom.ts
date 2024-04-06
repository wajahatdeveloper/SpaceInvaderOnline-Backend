import p2, { Body, World } from "p2";
import { GamePlayer } from "./gamePlayer";
import { Server } from "socket.io";
import { CANVAS_WIDTH, GAME_TICKER_MS, PHYSICS_WORLD_TIMESTEP, PLAYER_SCORE_INCREMENT, PLAYER_VERTICAL_INCREMENT, PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL, SHIP_POSITION_Y } from "./support/constants";
import { calculateRandomVelocity } from "./support/utility";
import { MatchUpdateObject, PlayerUpdateObject } from "./support/types";

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
    console.log(`New Room Created with Id ${this.roomId}`);
  }

  startMatch() {
    console.log('Starting Match');

    this.p2World = new World({ gravity: [0, -9.82] });
    this.p2WorldInterval = setInterval(() => routine_P2PhysicsStep(gameRoom), 1000 * PHYSICS_WORLD_TIMESTEP);
    this.stateUpdateInterval = setInterval(() => routine_gameStateUpdate(gameRoom), GAME_TICKER_MS);
    
    this.shipDynamicBody = new Body({
      position: [this.currentShipXPosition, SHIP_POSITION_Y],
      velocity: [calculateRandomVelocity(), 0]
    });
    
    this.p2World!.addBody(this.shipDynamicBody!);

    this.playersInRoom!.forEach((player) => {
      player.socket.on('player-input', (keyPressed) => {this.handlePlayerInput(player, keyPressed);});
      player.socket.on('player-lost', () => {this.handlePlayerLost(player);});
      this.startDownwardMovement(player);
    });

    this.isMatchStarted = true;
  }

  update(): void {
    // wait for match to start
    if (!this.isMatchStarted) {
      return;
    }

    // check player count is valid
    if (this.playersInRoom?.length <= 1) {
      // give the last remaining player the win, and close the room
      const player = this.playersInRoom[0];
      this.handlePlayerWon(player);
      console.log(`Cleaning up room ${this.roomId}`);
      this.delete();
    }

    // update ship position
    
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
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    }, PLAYER_VERTICAL_MOVEMENT_UPDATE_INTERVAL);
  }

  handlePlayerWon(player: GamePlayer) {
    player.socket.emit('you-win');
    console.log(`Player ${player.username} won the match!`);
  }

  handlePlayerLost(player: GamePlayer) {
    player.socket.emit('you-lose');
    console.log(`Player ${player.username} lost the match!`);
  }

  handlePlayerInput(player: GamePlayer, keyPressed: string) {  
    if (keyPressed === 'left') {
      if (player.x - 20 < 20) {
        player.x = 20;
      } else {
        player.x -= 20;
      }
    } else if (keyPressed === 'right') {
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
      this.shipDynamicBody!.velocity[0] = calculateRandomVelocity(); ;
    }
  
    // process the physics step
    this.p2World!.step(PHYSICS_WORLD_TIMESTEP);
  
    // enforce ship bounds
    if (this.shipDynamicBody!.position[0] > CANVAS_WIDTH && this.shipDynamicBody!.velocity[0] > 0) {
      this.shipDynamicBody!.position[0] = 0;
    } else if (this.shipDynamicBody!.position[0] < 0 && this.shipDynamicBody!.velocity[0] < 0) {
      this.shipDynamicBody!.position[0] = CANVAS_WIDTH - 32;
    }
  
    // set ship velocity in room state
    this.currentShipXPosition = this.shipDynamicBody!.position[0];
  }

  routine_gameStateUpdate() {
    const gameUpdate: MatchUpdateObject = {
      playerUpdates: [],
      shootBullet: ShouldFireBullet(),
      shipPositionX : this.shipDynamicBody!.position[0],
    };
    this.playersInRoom!.forEach(player => {
      const playerUpdate: PlayerUpdateObject = {
        username: player.username,
        x: player.x,
        y: player.y,
        avatarIndex: player.avatarIndex,
        score: player.score,
        isAlive: player.isAlive,
      }
      gameUpdate.playerUpdates.push(playerUpdate);
    });
    this.socketIO.to(this.roomId).emit('game-state', gameUpdate);
  }

  ShouldFireBullet() : boolean {
    let bulletOrBlank = 0;
    this.bulletShootTimerValue += GAME_TICKER_MS;
    
    // shoot every 5th update cycle
    if (this.bulletShootTimerValue >= GAME_TICKER_MS * 50) {
      this.bulletShootTimerValue = 0;
      bulletOrBlank = Math.floor(((Math.random() * 2000) + 50) * 1000);
    }
    
    return bulletOrBlank > 0 ? true : false;
  }

}