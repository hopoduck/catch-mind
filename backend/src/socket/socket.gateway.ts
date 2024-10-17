import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { END_WAIT_TIME, START_WAIT_TIME, words } from 'src/constants';
import Metrics from 'src/metrics';
import { randomWord } from 'src/util';
import { CatchMindUser } from './socket';
import { ClientEmitEvent, ServerEmitEvent } from './SocketEvent';

interface GameRoomInfo {
  wordHistory: Set<string>;

  inProgress: boolean;
  startTimeoutId: NodeJS.Timeout;
  endTimeoutId: NodeJS.Timeout;
  word: string;
  painter: CatchMindUser;
  winner: CatchMindUser;
  sockets: CatchMindUser[];

  gameTimeout: number;
  changeTimeoutRequest:
    | {
        currentClientCount: number;
        time: number;
        agree: Set<string>;
        disagree: Set<string>;
        timeoutId: NodeJS.Timeout;
      }
    | undefined;
}

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public readonly server: Server;

  private readonly roomContext: Record<string, GameRoomInfo> = {};

  handleConnection(client: Socket) {
    client.nickname ??= 'Anonymous';
    console.log('connected!', client.id);
    Metrics.connectedUserCount.inc();
  }

  handleDisconnect(client: Socket) {
    const context = this.loadContext(client);
    client.broadcast.to(client.roomId).emit(ServerEmitEvent.disconnected, {
      nickname: client.nickname,
    });
    if (!context) return;
    context.sockets = context.sockets.filter(
      (socket) => socket.id !== client.id,
    );
    this.playerUpdate(client.roomId);
    if (context.sockets.length <= 1 || context.painter?.id === client.id) {
      this.endGame(client.roomId);
      this.perfectlyClearGameData(client.roomId);
    }
    Metrics.connectedUserCount.dec();

    console.log('disconnected!!!', client.id, context.sockets);
  }

  @SubscribeMessage(ClientEmitEvent.setNickname)
  handleSetNickname(
    client: Socket,
    { roomId, nickname }: { roomId: string; nickname: string },
  ) {
    this.initGameRoomInfo(roomId);

    client.roomId = roomId;
    client.nickname = nickname;
    client.broadcast.to(roomId).emit(ServerEmitEvent.newUser, { nickname });
    client.join(roomId);

    const context = this.loadContext(client);
    context.sockets.push({
      id: client.id,
      nickname,
      points: 0,
    });
    this.playerUpdate(client.roomId);
    console.log('current player', roomId, context);
    if (context.sockets.length >= 2) {
      this.startGame(client.roomId);
    }
    Metrics.joinUserCount.inc();
    console.log('set new nickname!', nickname);
  }

  @SubscribeMessage(ClientEmitEvent.sendMessage)
  handleSendMessage(client: Socket, { message }: { message: string }) {
    client.broadcast.to(client.roomId).emit(ServerEmitEvent.newMessage, {
      message,
      nickname: client.nickname,
    });
    if (message === this.roomContext[client.roomId].word) {
      this.setWinner({
        roomId: client.roomId,
        winnerId: client.id,
      });
      this.playerUpdate(client.roomId);
      this.endGame(client.roomId);
    }
    Metrics.sendMessageCount.inc();

    console.log('new message!', message);
  }

  // ------------- Canvas -------------
  @SubscribeMessage(ClientEmitEvent.beginPath)
  handleBeginPath(client: Socket, { x, y }: { x: number; y: number }) {
    client.broadcast
      .to(client.roomId)
      .emit(ServerEmitEvent.beganPath, { x, y });
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
    client.broadcast.to(client.roomId).emit(ServerEmitEvent.strokedPath, {
      x,
      y,
      color,
      lineWidth,
    });
    console.log('strokePath', x, y);
  }

  @SubscribeMessage(ClientEmitEvent.fill)
  handleFilled(client: Socket, { color }: { color: string }) {
    client.broadcast.to(client.roomId).emit(ServerEmitEvent.filled, { color });
    console.log('filled', color);
  }

  @SubscribeMessage(ClientEmitEvent.skip)
  handleSkipped(client: Socket) {
    this.endGame(client.roomId);
  }

  @SubscribeMessage(ClientEmitEvent.changeTimeoutRequest)
  handleChangeTimeout(client: Socket, { time }: { time: number }) {
    const context = this.loadContext(client);
    if (!context.changeTimeoutRequest) {
      const timeoutId = setTimeout(() => {
        this.summarizeChangeTimeout(client.roomId);
      }, 30000);
      context.changeTimeoutRequest = {
        currentClientCount: context.sockets.length,
        time,
        agree: new Set<string>(),
        disagree: new Set<string>(),
        timeoutId,
      };
      context.changeTimeoutRequest.agree.add(client.id);
      client.broadcast
        .to(client.roomId)
        .emit(ServerEmitEvent.changeTimeoutRequested, { time });
    }
  }

  @SubscribeMessage(ClientEmitEvent.changeTimeoutAgree)
  handleChangeTimeoutAgree(client: Socket) {
    const context = this.loadContext(client);
    if (!context.changeTimeoutRequest) return;
    context.changeTimeoutRequest.agree.add(client.id);
    const { currentClientCount, agree, disagree } =
      context.changeTimeoutRequest;
    if (currentClientCount === agree.size + disagree.size) {
      this.summarizeChangeTimeout(client.roomId);
    }
  }

  @SubscribeMessage(ClientEmitEvent.changeTimeoutDisagree)
  handleChangeTimeoutDisagree(client: Socket) {
    const context = this.loadContext(client);
    if (!context.changeTimeoutRequest) return;
    context.changeTimeoutRequest.disagree.add(client.id);
    const { currentClientCount, agree, disagree } =
      context.changeTimeoutRequest;
    if (currentClientCount === agree.size + disagree.size) {
      this.summarizeChangeTimeout(client.roomId);
    }
  }

  private summarizeChangeTimeout(roomId: string) {
    const context = this.roomContext[roomId];
    if (!context.changeTimeoutRequest) return;
    const { agree, disagree, time, timeoutId } = context.changeTimeoutRequest;
    clearTimeout(timeoutId);
    if (agree.size >= disagree.size) {
      context.gameTimeout = time * 1000;
      this.server
        .to(roomId)
        .emit(ServerEmitEvent.changeTimeoutResolved, { time });
    } else {
      this.server.to(roomId).emit(ServerEmitEvent.changeTimeoutRejected);
    }
    context.changeTimeoutRequest = undefined;
  }

  private playerUpdate(roomId: string) {
    this.server.to(roomId).emit(ServerEmitEvent.playerUpdate, {
      players: this.roomContext[roomId].sockets,
    });
  }

  private initGameRoomInfo(roomId: string) {
    this.roomContext[roomId] ??= {
      wordHistory: new Set<string>(),
      inProgress: false,
      startTimeoutId: undefined,
      endTimeoutId: undefined,
      word: undefined,
      painter: null,
      winner: null,
      sockets: [],
      gameTimeout: END_WAIT_TIME,
      changeTimeoutRequest: undefined,
    };
    Metrics.sessionCount.set(Object.values(this.roomContext).length);
  }

  private loadContext(socket: Socket) {
    return this.roomContext[socket.roomId];
  }

  private startGame(roomId: string) {
    const context = this.roomContext[roomId];
    if (context.inProgress) return;
    if (context.sockets.length <= 1) return;

    context.inProgress = true;
    context.painter =
      context.sockets[Math.floor(Math.random() * context.sockets.length)];

    if (context.wordHistory.size >= words.length) {
      context.wordHistory.clear();
    }

    while (true) {
      context.word = randomWord();
      if (!context.wordHistory.has(context.word)) {
        context.wordHistory.add(context.word);
        break;
      }
    }

    this.server.to(roomId).emit(ServerEmitEvent.gameStarting, {
      start: Date.now(),
      end: Date.now() + START_WAIT_TIME,
    });
    context.startTimeoutId = setTimeout(() => {
      if (!context.painter) {
        this.endGame(roomId);
        return;
      }
      this.server.to(roomId).emit(ServerEmitEvent.gameStarted, {
        id: context.painter.id,
        start: Date.now(),
        end: Date.now() + context.gameTimeout,
      });
      this.server.to(context.painter.id).emit(ServerEmitEvent.painterNotify, {
        word: context.word,
      });
      context.endTimeoutId = setTimeout(
        () => this.endGame(roomId),
        context.gameTimeout,
      );
      Metrics.startGameCount.inc();
    }, START_WAIT_TIME);
    console.log('start game');
  }

  private setWinner({
    roomId,
    winnerId,
  }: {
    roomId: string;
    winnerId: string;
  }) {
    const context = this.roomContext[roomId];
    context.winner = context.sockets.find((socket) => socket.id === winnerId);
    if (context.winner) {
      context.winner.points += 10;
      Metrics.winnerExistGameCount.inc();
    }
  }

  private endGame(roomId: string) {
    const context = this.roomContext[roomId];
    context.inProgress = false;
    this.server.to(roomId).emit(ServerEmitEvent.gameEnded, {
      winnerId: context.winner?.id,
      winnerNickname: context.winner?.nickname,
      word: context.word,
    });
    clearTimeout(context.startTimeoutId);
    clearTimeout(context.endTimeoutId);
    this.cleanGameData(roomId);
    console.log('gameEnded');

    this.startGame(roomId);
  }

  private cleanGameData(roomId: string) {
    const context = this.roomContext[roomId];
    context.word = undefined;
    context.painter = undefined;
    context.winner = undefined;
  }

  private perfectlyClearGameData(roomId: string) {
    this.cleanGameData(roomId);
    const context = this.roomContext[roomId];
    console.log('perfectClearGameData');
    context.wordHistory.clear();
    context.gameTimeout = END_WAIT_TIME;
    if (context.changeTimeoutRequest?.timeoutId) {
      clearTimeout(context.changeTimeoutRequest.timeoutId);
    }
    context.changeTimeoutRequest = undefined;
    if (context.sockets?.length === 0) {
      this.roomContext[roomId] = undefined;
      delete this.roomContext[roomId];
    }
    Metrics.sessionCount.set(Object.values(this.roomContext).length);
  }
}
