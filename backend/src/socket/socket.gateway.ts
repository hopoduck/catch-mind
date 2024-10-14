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
  }

  handleDisconnect(client: Socket) {
    client.broadcast.to(client.roomId).emit(ServerEmitEvent.disconnected, {
      nickname: client.nickname,
    });
    this.roomContext[client.roomId].sockets = this.roomContext[
      client.roomId
    ].sockets.filter((socket) => socket.id !== client.id);
    this.playerUpdate(client.roomId);
    if (
      this.roomContext[client.roomId].sockets.length <= 1 ||
      this.roomContext[client.roomId].painter?.id === client.id
    ) {
      this.endGame(client.roomId);
      this.perfectlyClearGameData(client.roomId);
    }

    console.log(
      'disconnected!!!',
      client.id,
      this.roomContext[client.roomId].sockets,
    );
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
    this.roomContext[roomId].sockets.push({
      id: client.id,
      nickname,
      points: 0,
    });
    this.playerUpdate(client.roomId);
    if (this.roomContext[roomId].sockets.length >= 2) {
      this.startGame(client.roomId);
    }
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
    if (!this.roomContext[client.roomId].changeTimeoutRequest) {
      const timeoutId = setTimeout(() => {
        this.summarizeChangeTimeout(client.roomId);
      }, 30000);
      this.roomContext[client.roomId].changeTimeoutRequest = {
        currentClientCount: this.roomContext[client.roomId].sockets.length,
        time,
        agree: new Set<string>(),
        disagree: new Set<string>(),
        timeoutId,
      };
      this.roomContext[client.roomId].changeTimeoutRequest.agree.add(client.id);
      client.broadcast
        .to(client.roomId)
        .emit(ServerEmitEvent.changeTimeoutRequested, { time });
    }
  }

  @SubscribeMessage(ClientEmitEvent.changeTimeoutAgree)
  handleChangeTimeoutAgree(client: Socket) {
    if (!this.roomContext[client.roomId].changeTimeoutRequest) return;
    this.roomContext[client.roomId].changeTimeoutRequest.agree.add(client.id);
    const { currentClientCount, agree, disagree } =
      this.roomContext[client.roomId].changeTimeoutRequest;
    if (currentClientCount === agree.size + disagree.size) {
      this.summarizeChangeTimeout(client.roomId);
    }
  }

  @SubscribeMessage(ClientEmitEvent.changeTimeoutDisagree)
  handleChangeTimeoutDisagree(client: Socket) {
    if (!this.roomContext[client.roomId].changeTimeoutRequest) return;
    this.roomContext[client.roomId].changeTimeoutRequest.disagree.add(
      client.id,
    );
    const { currentClientCount, agree, disagree } =
      this.roomContext[client.roomId].changeTimeoutRequest;
    if (currentClientCount === agree.size + disagree.size) {
      this.summarizeChangeTimeout(client.roomId);
    }
  }

  private summarizeChangeTimeout(roomId: string) {
    if (!this.roomContext[roomId].changeTimeoutRequest) return;
    const { agree, disagree, time, timeoutId } =
      this.roomContext[roomId].changeTimeoutRequest;
    clearTimeout(timeoutId);
    if (agree.size >= disagree.size) {
      this.roomContext[roomId].gameTimeout = time * 1000;
      this.server
        .to(roomId)
        .emit(ServerEmitEvent.changeTimeoutResolved, { time });
    } else {
      this.server.to(roomId).emit(ServerEmitEvent.changeTimeoutRejected);
    }
    this.roomContext[roomId].changeTimeoutRequest = undefined;
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
  }

  private startGame(roomId: string) {
    if (this.roomContext[roomId].inProgress) return;
    if (this.roomContext[roomId].sockets.length <= 1) return;

    this.roomContext[roomId].inProgress = true;
    this.roomContext[roomId].painter =
      this.roomContext[roomId].sockets[
        Math.floor(Math.random() * this.roomContext[roomId].sockets.length)
      ];

    if (this.roomContext[roomId].wordHistory.size >= words.length) {
      this.roomContext[roomId].wordHistory.clear();
    }

    while (true) {
      this.roomContext[roomId].word = randomWord();
      if (
        !this.roomContext[roomId].wordHistory.has(this.roomContext[roomId].word)
      ) {
        this.roomContext[roomId].wordHistory.add(this.roomContext[roomId].word);
        break;
      }
    }

    this.server.to(roomId).emit(ServerEmitEvent.gameStarting, {
      start: Date.now(),
      end: Date.now() + START_WAIT_TIME,
    });
    this.roomContext[roomId].startTimeoutId = setTimeout(() => {
      this.server.to(roomId).emit(ServerEmitEvent.gameStarted, {
        id: this.roomContext[roomId].painter.id,
        start: Date.now(),
        end: Date.now() + this.roomContext[roomId].gameTimeout,
      });
      this.server
        .to(this.roomContext[roomId].painter.id)
        .emit(ServerEmitEvent.painterNotify, {
          word: this.roomContext[roomId].word,
        });
      this.roomContext[roomId].endTimeoutId = setTimeout(
        () => this.endGame(roomId),
        this.roomContext[roomId].gameTimeout,
      );
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
    this.roomContext[roomId].winner = this.roomContext[roomId].sockets.find(
      (socket) => socket.id === winnerId,
    );
    if (this.roomContext[roomId].winner) {
      this.roomContext[roomId].winner.points += 10;
    }
  }

  private endGame(roomId: string) {
    this.roomContext[roomId].inProgress = false;
    this.server.to(roomId).emit(ServerEmitEvent.gameEnded, {
      winnerId: this.roomContext[roomId].winner?.id,
      winnerNickname: this.roomContext[roomId].winner?.nickname,
      word: this.roomContext[roomId].word,
    });
    clearTimeout(this.roomContext[roomId].startTimeoutId);
    clearTimeout(this.roomContext[roomId].endTimeoutId);
    this.cleanGameData(roomId);
    console.log('gameEnded');

    this.startGame(roomId);
  }

  private cleanGameData(roomId: string) {
    this.roomContext[roomId].word = undefined;
    this.roomContext[roomId].painter = undefined;
    this.roomContext[roomId].winner = undefined;
  }

  private perfectlyClearGameData(roomId: string) {
    console.log('perfectClearGameData');
    this.roomContext[roomId].wordHistory.clear();
    this.roomContext[roomId].gameTimeout = END_WAIT_TIME;
    if (this.roomContext[roomId].changeTimeoutRequest?.timeoutId) {
      clearTimeout(this.roomContext[roomId].changeTimeoutRequest.timeoutId);
    }
    this.roomContext[roomId].changeTimeoutRequest = undefined;
    this.cleanGameData(roomId);
  }
}
