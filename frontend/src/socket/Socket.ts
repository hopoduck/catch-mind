import { io } from "socket.io-client";
import { Events } from "./Events";

export default class Socket {
  private socket = io({ transports: ["websocket"] });
  public nickname: string;

  constructor(nickname: string) {
    this.nickname = nickname;
    this.socket.emit(Events.setNickname, { nickname });
  }

  public addHandleNewUser(
    listener: ({ nickname }: { nickname: string }) => void,
  ) {
    this.socket.on(Events.newUser, listener);
    return () => this.socket.off(Events.newUser, listener);
  }

  public addHandleDisconnected(
    listener: ({ nickname }: { nickname: string }) => void,
  ) {
    this.socket.on(Events.disconnected, listener);
    return () => this.socket.off(Events.disconnected, listener);
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
    this.socket.on(Events.newMessage, listener);
    return () => this.socket.off(Events.newMessage, listener);
  }

  public addHandleBeganPath(
    listener: ({ x, y }: { x: number; y: number }) => void,
  ) {
    this.socket.on(Events.beganPath, listener);
    return () => this.socket.off(Events.beganPath, listener);
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
    this.socket.on(Events.strokedPath, listener);
    return () => this.socket.off(Events.strokedPath, listener);
  }

  public addHandleFilled(listener: ({ color }: { color: string }) => void) {
    this.socket.on(Events.filled, listener);
    return () => this.socket.off(Events.filled, listener);
  }

  public addHandlePlayerUpdate(
    listener: ({ players }: { players: Player[] }) => void,
  ) {
    this.socket.on(Events.playerUpdate, listener);
    return () => this.socket.off(Events.playerUpdate, listener);
  }

  public addHandleGameStarted(listener: () => void) {
    this.socket.on(Events.gameStarted, listener);
    return () => this.socket.off(Events.gameStarted, listener);
  }

  public addHandleLeaderNotify(listener: ({ word }: { word: string }) => void) {
    this.socket.on(Events.leaderNotify, listener);
    return () => this.socket.off(Events.leaderNotify, listener);
  }

  public addHandleGameEnded(listener: () => void) {
    this.socket.on(Events.gameEnded, listener);
    return () => this.socket.off(Events.gameEnded, listener);
  }

  public addHandleGameStarting(listener: () => void) {
    this.socket.on(Events.gameStaring, listener);
    return () => this.socket.off(Events.gameStaring, listener);
  }

  // private init() {
  //   this.socket.on("newMessage", (data) => {
  //     console.log("received!", data);
  //   });
  //   this.socket.on("messageNotification", ({ message }) => {
  //     console.log("somebody said ", message);
  //   });
  // }

  sendMessage(message: string) {
    this.socket.emit(Events.sendMessage, { message });
  }

  sendBeginPath({ x, y }: { x: number; y: number }) {
    this.socket.emit(Events.beginPath, { x, y });
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
    this.socket.emit(Events.strokePath, { x, y, style });
  }

  sendFill({ color }: { color: string }) {
    this.socket.emit(Events.fill, { color });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
