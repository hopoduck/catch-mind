import { io } from "socket.io-client";
import { ClientEmitEvent, ServerEmitEvent } from "./SocketEvent";

export default class Socket {
  private socket = io({ transports: ["websocket"] });
  public nickname: string;

  constructor(nickname: string) {
    this.nickname = nickname;
    this.socket.emit(ClientEmitEvent.setNickname, { nickname });
  }

  public addHandleNewUser(
    listener: ({ nickname }: { nickname: string }) => void,
  ) {
    this.socket.on(ServerEmitEvent.newUser, listener);
    return () => this.socket.off(ServerEmitEvent.newUser, listener);
  }

  public addHandleDisconnected(
    listener: ({ nickname }: { nickname: string }) => void,
  ) {
    this.socket.on(ServerEmitEvent.disconnected, listener);
    return () => this.socket.off(ServerEmitEvent.disconnected, listener);
  }

  public addHandleNewMessage(
    listener: ({
      message,
      nickname,
    }: {
      message: string;
      nickname: string;
    }) => void,
  ) {
    this.socket.on(ServerEmitEvent.newMessage, listener);
    return () => this.socket.off(ServerEmitEvent.newMessage, listener);
  }

  public addHandleBeganPath(
    listener: ({ x, y }: { x: number; y: number }) => void,
  ) {
    this.socket.on(ServerEmitEvent.beganPath, listener);
    return () => this.socket.off(ServerEmitEvent.beganPath, listener);
  }

  public addHandleStrokedPath(
    listener: ({
      x,
      y,
      style,
    }: {
      x: number;
      y: number;
      style: {
        color: string;
        width: number;
      };
    }) => void,
  ) {
    this.socket.on(ServerEmitEvent.strokedPath, listener);
    return () => this.socket.off(ServerEmitEvent.strokedPath, listener);
  }

  public addHandleFilled(listener: ({ color }: { color: string }) => void) {
    this.socket.on(ServerEmitEvent.filled, listener);
    return () => this.socket.off(ServerEmitEvent.filled, listener);
  }

  public addHandlePlayerUpdate(
    listener: ({ players }: { players: Player[] }) => void,
  ) {
    this.socket.on(ServerEmitEvent.playerUpdate, listener);
    return () => this.socket.off(ServerEmitEvent.playerUpdate, listener);
  }

  public addHandleGameStarted(listener: () => void) {
    this.socket.on(ServerEmitEvent.gameStarted, listener);
    return () => this.socket.off(ServerEmitEvent.gameStarted, listener);
  }

  public addHandleLeaderNotify(listener: ({ word }: { word: string }) => void) {
    this.socket.on(ServerEmitEvent.leaderNotify, listener);
    return () => this.socket.off(ServerEmitEvent.leaderNotify, listener);
  }

  public addHandleGameEnded(listener: () => void) {
    this.socket.on(ServerEmitEvent.gameEnded, listener);
    return () => this.socket.off(ServerEmitEvent.gameEnded, listener);
  }

  public addHandleGameStarting(listener: () => void) {
    this.socket.on(ServerEmitEvent.gameStarting, listener);
    return () => this.socket.off(ServerEmitEvent.gameStarting, listener);
  }

  sendMessage(message: string) {
    this.socket.emit(ClientEmitEvent.sendMessage, { message });
  }

  sendBeginPath({ x, y }: { x: number; y: number }) {
    this.socket.emit(ClientEmitEvent.beginPath, { x, y });
  }

  sendStrokePath({
    x,
    y,
    style,
  }: {
    x: number;
    y: number;
    style: {
      color: string;
      width: number;
    };
  }) {
    this.socket.emit(ClientEmitEvent.strokePath, { x, y, style });
  }

  sendFill({ color }: { color: string }) {
    this.socket.emit(ClientEmitEvent.fill, { color });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
