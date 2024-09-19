import { io } from "socket.io-client";
import { Events } from "./Events";

export default class Socket {
  private socket = io({ transports: ["websocket"] });
  public nickname: string;

  constructor(nickname: string) {
    this.nickname = nickname;
    this.socket.emit(Events.setNickname, { nickname });
  }

  public setHandleNewUser(
    listener: ({ nickname }: { nickname: string }) => void,
  ) {
    this.socket.on(Events.newUser, listener);
    return () => this.socket.off(Events.newUser, listener);
  }

  public setHandleDisconnected(
    listener: ({ nickname }: { nickname: string }) => void,
  ) {
    this.socket.on(Events.disconnected, listener);
    return () => this.socket.off(Events.disconnected, listener);
  }

  public setHandleNewMessage(
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

  public setHandleBeganPath(
    listener: ({ x, y }: { x: number; y: number }) => void,
  ) {
    this.socket.on(Events.beganPath, listener);
    return () => this.socket.off(Events.beganPath, listener);
  }

  public setHandleStrokedPath(
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

  public setHandleFilled(listener: ({ color }: { color: string }) => void) {
    this.socket.on(Events.filled, listener);
    return () => this.socket.off(Events.filled, listener);
  }

  public setHandlePlayerUpdate(
    listener: ({ players }: { players: Player[] }) => void,
  ) {
    this.socket.on(Events.playerUpdate, listener);
    return () => this.socket.off(Events.playerUpdate, listener);
  }

  public setHandleGameStarted(listener: () => void) {
    this.socket.on(Events.gameStarted, listener);
    return () => this.socket.off(Events.gameStarted, listener);
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
