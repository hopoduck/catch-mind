import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { END_WAIT_TIME, START_WAIT_TIME } from 'src/constants';
import { randomWord } from 'src/util';
import { CatchMindUser } from './socket';
import { ClientEmitEvent, ServerEmitEvent } from './SocketEvent';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: Server;

  private inProgress = false;
  private startTimeoutId: NodeJS.Timeout;
  private endTimeoutId: NodeJS.Timeout;
  private word: string;
  private painter: CatchMindUser = null;
  private winner: CatchMindUser = null;
  private sockets: CatchMindUser[] = [];

  handleConnection(client: Socket) {
    client.nickname = 'Anonymous';
    console.log('connected!', client.id);
  }

  handleDisconnect(client: Socket) {
    client.broadcast.emit(ServerEmitEvent.disconnected, {
      nickname: client.nickname,
    });
    this.sockets = this.sockets.filter((socket) => socket.id !== client.id);
    this.playerUpdate();
    if (this.sockets.length <= 1 || this.painter?.id === client.id) {
      this.endGame();
    }

    console.log('disconnected!!!', client.id, this.sockets);
  }

  @SubscribeMessage(ClientEmitEvent.setNickname)
  handleSetNickname(client: Socket, { nickname }: { nickname: string }) {
    client.nickname = nickname;
    client.broadcast.emit(ServerEmitEvent.newUser, { nickname });
    this.sockets.push({
      id: client.id,
      nickname,
      points: 0,
    });
    this.playerUpdate();
    if (this.sockets.length >= 2) {
      this.startGame();
    }
    console.log('set new nickname!', nickname);
  }

  @SubscribeMessage(ClientEmitEvent.sendMessage)
  handleSendMessage(client: Socket, { message }: { message: string }) {
    client.broadcast.emit(ServerEmitEvent.newMessage, {
      message,
      nickname: client.nickname,
    });
    if (message === this.word) {
      this.setWinner(client.id);
      this.playerUpdate();
      this.endGame();
    }

    console.log('new message!', message);
  }

  // ------------- Canvas -------------
  @SubscribeMessage(ClientEmitEvent.beginPath)
  handleBeginPath(client: Socket, { x, y }: { x: number; y: number }) {
    client.broadcast.emit(ServerEmitEvent.beganPath, { x, y });
    console.log('beginPath', x, y);
  }

  @SubscribeMessage(ClientEmitEvent.strokePath)
  handleStrokePath(
    client: Socket,
    {
      x,
      y,
      color,
      lineWidth,
    }: { x: number; y: number; color: string; lineWidth: number },
  ) {
    client.broadcast.emit(ServerEmitEvent.strokedPath, {
      x,
      y,
      color,
      lineWidth,
    });
    console.log('strokePath', x, y);
  }

  @SubscribeMessage(ClientEmitEvent.fill)
  handleFilled(client: Socket, { color }: { color: string }) {
    client.broadcast.emit(ServerEmitEvent.filled, { color });
    console.log('filled', color);
  }

  @SubscribeMessage(ClientEmitEvent.skip)
  handleSkipped() {
    this.endGame();
  }

  private playerUpdate() {
    this.server.emit(ServerEmitEvent.playerUpdate, { players: this.sockets });
  }

  private startGame() {
    if (this.inProgress) return;
    if (this.sockets.length <= 1) return;

    this.inProgress = true;
    this.painter =
      this.sockets[Math.floor(Math.random() * this.sockets.length)];
    this.word = randomWord();
    this.server.emit(ServerEmitEvent.gameStarting, {
      start: Date.now(),
      end: Date.now() + START_WAIT_TIME,
    });
    this.startTimeoutId = setTimeout(() => {
      this.server.emit(ServerEmitEvent.gameStarted, {
        id: this.painter.id,
        start: Date.now(),
        end: Date.now() + END_WAIT_TIME,
      });
      this.server
        .to(this.painter.id)
        .emit(ServerEmitEvent.painterNotify, { word: this.word });
      this.endTimeoutId = setTimeout(() => this.endGame(), END_WAIT_TIME);
    }, START_WAIT_TIME);
    console.log('start game');
  }

  private setWinner(winnerId: string) {
    this.winner = this.sockets.find((socket) => socket.id === winnerId);
    if (this.winner) {
      this.winner.points += 10;
    }
  }

  private endGame() {
    this.inProgress = false;
    this.server.emit(ServerEmitEvent.gameEnded, {
      winnerId: this.winner?.id,
      word: this.word,
    });
    clearTimeout(this.startTimeoutId);
    clearTimeout(this.endTimeoutId);
    this.cleanGameData();
    console.log('gameEnded');

    this.startGame();
  }

  private cleanGameData() {
    this.word = undefined;
    this.painter = undefined;
    this.winner = undefined;
  }
}
