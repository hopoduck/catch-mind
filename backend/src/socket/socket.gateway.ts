import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { END_WAIT_TIME, START_WAIT_TIME, words } from 'src/constants';
import { randomWord } from 'src/util';
import { CatchMindUser } from './socket';
import { ClientEmitEvent, ServerEmitEvent } from './SocketEvent';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public readonly server: Server;
  private readonly wordHistory = new Set<string>();

  private inProgress = false;
  private startTimeoutId: NodeJS.Timeout;
  private endTimeoutId: NodeJS.Timeout;
  private word: string;
  private painter: CatchMindUser = null;
  private winner: CatchMindUser = null;
  private sockets: CatchMindUser[] = [];

  private gameTimeout: number = END_WAIT_TIME;
  private changeTimeoutRequest:
    | {
        currentClientCount: number;
        time: number;
        agree: Set<string>;
        disagree: Set<string>;
        timeoutId: NodeJS.Timeout;
      }
    | undefined = undefined;

  handleConnection(client: Socket) {
    client.nickname ??= 'Anonymous';
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
      this.perfectlyClearGameData();
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

  @SubscribeMessage(ClientEmitEvent.changeTimeoutRequest)
  handleChangeTimeout(client: Socket, { time }: { time: number }) {
    if (!this.changeTimeoutRequest) {
      const timeoutId = setTimeout(() => {
        this.summarizeChangeTimeout();
      }, 30000);
      this.changeTimeoutRequest = {
        currentClientCount: this.sockets.length,
        time,
        agree: new Set<string>(),
        disagree: new Set<string>(),
        timeoutId,
      };
      this.changeTimeoutRequest.agree.add(client.id);
      client.broadcast.emit(ServerEmitEvent.changeTimeoutRequested, { time });
    }
  }

  @SubscribeMessage(ClientEmitEvent.changeTimeoutAgree)
  handleChangeTimeoutAgree(client: Socket) {
    if (!this.changeTimeoutRequest) return;
    this.changeTimeoutRequest.agree.add(client.id);
    const { currentClientCount, agree, disagree } = this.changeTimeoutRequest;
    if (currentClientCount === agree.size + disagree.size) {
      this.summarizeChangeTimeout();
    }
  }

  @SubscribeMessage(ClientEmitEvent.changeTimeoutDisagree)
  handleChangeTimeoutDisagree(client: Socket) {
    if (!this.changeTimeoutRequest) return;
    this.changeTimeoutRequest.disagree.add(client.id);
    const { currentClientCount, agree, disagree } = this.changeTimeoutRequest;
    if (currentClientCount === agree.size + disagree.size) {
      this.summarizeChangeTimeout();
    }
  }

  private summarizeChangeTimeout() {
    if (!this.changeTimeoutRequest) return;
    const { agree, disagree, time, timeoutId } = this.changeTimeoutRequest;
    clearTimeout(timeoutId);
    if (agree.size >= disagree.size) {
      this.gameTimeout = time * 1000;
      this.server.emit(ServerEmitEvent.changeTimeoutResolved, { time });
    } else {
      this.server.emit(ServerEmitEvent.changeTimeoutRejected);
    }
    this.changeTimeoutRequest = undefined;
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

    if (this.wordHistory.size >= words.length) {
      this.wordHistory.clear();
    }

    while (true) {
      this.word = randomWord();
      if (!this.wordHistory.has(this.word)) {
        this.wordHistory.add(this.word);
        break;
      }
    }

    this.server.emit(ServerEmitEvent.gameStarting, {
      start: Date.now(),
      end: Date.now() + START_WAIT_TIME,
    });
    this.startTimeoutId = setTimeout(() => {
      this.server.emit(ServerEmitEvent.gameStarted, {
        id: this.painter.id,
        start: Date.now(),
        end: Date.now() + this.gameTimeout,
      });
      this.server
        .to(this.painter.id)
        .emit(ServerEmitEvent.painterNotify, { word: this.word });
      this.endTimeoutId = setTimeout(() => this.endGame(), this.gameTimeout);
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
      winnerNickname: this.winner?.nickname,
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

  private perfectlyClearGameData() {
    console.log('perfectClearGameData');
    this.wordHistory.clear();
    this.gameTimeout = END_WAIT_TIME;
    if (this.changeTimeoutRequest?.timeoutId) {
      clearTimeout(this.changeTimeoutRequest.timeoutId);
    }
    this.changeTimeoutRequest = undefined;
    this.cleanGameData();
  }
}
