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
  private leader: CatchMindUser = null;
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
    if (this.sockets.length <= 1 || this.leader?.id === client.id) {
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
      const winner = this.sockets.find((socket) => socket.id === client.id);
      winner.points += 10;
      // TODO: 우승자 찾아서 폭죽이라도..
      // this.server.to(winner.id).emit(ServerEmitEvent.winner);
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
    this.leader = this.sockets[Math.floor(Math.random() * this.sockets.length)];
    this.word = randomWord();
    this.server.emit(ServerEmitEvent.gameStarting);
    this.startTimeoutId = setTimeout(() => {
      this.server.emit(ServerEmitEvent.gameStarted, { id: this.leader.id });
      this.server
        .to(this.leader.id)
        .emit(ServerEmitEvent.leaderNotify, { word: this.word });
      this.endTimeoutId = setTimeout(() => this.endGame(), END_WAIT_TIME);
    }, START_WAIT_TIME);
    console.log('start game');
  }

  private endGame() {
    this.inProgress = false;
    this.server.emit(ServerEmitEvent.gameEnded);
    clearTimeout(this.startTimeoutId);
    clearTimeout(this.endTimeoutId);
    console.log('gameEnded');

    this.startGame();
  }
}
