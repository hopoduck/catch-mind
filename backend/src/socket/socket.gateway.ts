import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { randomWord } from 'src/constants';
import { CatchMindUser } from './socket';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: Server;

  private inProgress = false;
  private sockets: CatchMindUser[] = [];

  handleConnection(client: Socket) {
    client.nickname = 'Anonymous';
    console.log('connected!', client.id);
  }

  handleDisconnect(client: Socket) {
    client.broadcast.emit('disconnected', { nickname: client.nickname });
    this.sockets = this.sockets.filter((socket) => socket.id !== client.id);
    this.playerUpdate();
    if (this.sockets.length <= 1) {
      this.endGame();
    }

    console.log('disconnected!!!', client.id, this.sockets);
  }

  @SubscribeMessage('setNickname')
  handleSetNickname(client: Socket, { nickname }: { nickname: string }) {
    client.nickname = nickname;
    client.broadcast.emit('newUser', { nickname });
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

  @SubscribeMessage('sendMessage')
  handleSendMessage(client: Socket, { message }: { message: string }) {
    client.broadcast.emit('newMessage', {
      message,
      nickname: client.nickname,
    });
    console.log('new message!', message);
  }

  // ------------- Canvas -------------
  @SubscribeMessage('beginPath')
  handleBeginPath(client: Socket, { x, y }: { x: number; y: number }) {
    client.broadcast.emit('beganPath', { x, y });
    console.log('beginPath', x, y);
  }

  @SubscribeMessage('strokePath')
  handleStrokePath(
    client: Socket,
    {
      x,
      y,
      style,
    }: { x: number; y: number; style: { color: string; width: number } },
  ) {
    client.broadcast.emit('strokedPath', { x, y, style });
    console.log('strokePath', x, y);
  }

  @SubscribeMessage('fill')
  handleFilled(client: Socket, { color }: { color: string }) {
    client.broadcast.emit('filled', { color });
    console.log('filled', color);
  }

  private playerUpdate() {
    this.server.emit('playerUpdate', { players: this.sockets });
  }

  private startGame() {
    if (this.inProgress) return;

    this.inProgress = true;
    const leader =
      this.sockets[Math.floor(Math.random() * this.sockets.length)];
    const word = randomWord();
    this.server.to(leader.id).emit('leaderNotify', { word });
    this.server.emit('gameStarted');
  }

  private endGame() {
    this.inProgress = false;
  }
}
