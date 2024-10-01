import { io } from "socket.io-client";
import { Player } from "../local";
import { ClientEmitEvent, ServerEmitEvent } from "./SocketEvent";

export default class Socket {
  private socket = io({ transports: ["websocket"] });
  public nickname: string;

  constructor(nickname: string) {
    this.nickname = nickname;
    this.socket.emit(ClientEmitEvent.setNickname, { nickname });
  }

  get id() {
    return this.socket.id;
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
      color,
      lineWidth,
    }: {
      x: number;
      y: number;
      color: string;
      lineWidth: number;
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

  public addHandleGameStarting(
    listener: ({ start, end }: { start: number; end: number }) => void,
  ) {
    this.socket.on(ServerEmitEvent.gameStarting, listener);
    return () => this.socket.off(ServerEmitEvent.gameStarting, listener);
  }

  public addHandleGameStarted(
    listener: ({
      id,
      start,
      end,
    }: {
      id: string;
      start: number;
      end: number;
    }) => void,
  ) {
    this.socket.on(ServerEmitEvent.gameStarted, listener);
    return () => this.socket.off(ServerEmitEvent.gameStarted, listener);
  }

  public addHandlePainterNotify(
    listener: ({ word }: { word: string }) => void,
  ) {
    this.socket.on(ServerEmitEvent.painterNotify, listener);
    return () => this.socket.off(ServerEmitEvent.painterNotify, listener);
  }

  public addHandleGameEnded(
    listener: ({
      winnerId,
      winnerNickname,
      word,
    }: {
      winnerId: string;
      winnerNickname: string;
      word: string;
    }) => void,
  ) {
    this.socket.on(ServerEmitEvent.gameEnded, listener);
    return () => this.socket.off(ServerEmitEvent.gameEnded, listener);
  }

  public addHandleChangeTimeoutRequested(
    listener: ({ time }: { time: number }) => void,
  ) {
    this.socket.on(ServerEmitEvent.changeTimeoutRequested, listener);
    return () =>
      this.socket.off(ServerEmitEvent.changeTimeoutRequested, listener);
  }

  public addHandleChangeTimeoutResolved(
    listener: ({ time }: { time: number }) => void,
  ) {
    this.socket.on(ServerEmitEvent.changeTimeoutResolved, listener);
    return () =>
      this.socket.off(ServerEmitEvent.changeTimeoutResolved, listener);
  }

  public addHandleChangeTimeoutRejected(listener: () => void) {
    this.socket.on(ServerEmitEvent.changeTimeoutRejected, listener);
    return () =>
      this.socket.off(ServerEmitEvent.changeTimeoutRejected, listener);
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
    color,
    lineWidth,
  }: {
    x: number;
    y: number;
    color: string;
    lineWidth: number;
  }) {
    this.socket.emit(ClientEmitEvent.strokePath, { x, y, color, lineWidth });
  }

  sendFill({ color }: { color: string }) {
    this.socket.emit(ClientEmitEvent.fill, { color });
  }

  sendSkip() {
    this.socket.emit(ClientEmitEvent.skip);
  }

  sendChangeTimeoutRequest(time: number) {
    this.socket.emit(ClientEmitEvent.changeTimeoutRequest, { time });
  }

  sendChangeTimeoutAgree() {
    this.socket.emit(ClientEmitEvent.changeTimeoutAgree);
  }

  sendChangeTimeoutDisagree() {
    this.socket.emit(ClientEmitEvent.changeTimeoutDisagree);
  }

  disconnect() {
    this.socket.disconnect();
  }
}
