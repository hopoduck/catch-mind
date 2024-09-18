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
  }

  public setHandleDisconnected(
    listener: ({ nickname }: { nickname: string }) => void,
  ) {
    this.socket.on(Events.disconnected, listener);
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

  disconnect() {
    this.socket.disconnect();
  }
}
