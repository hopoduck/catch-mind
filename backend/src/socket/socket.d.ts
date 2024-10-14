import 'socket.io';

declare module 'socket.io' {
  export interface Socket {
    roomId: string;
    nickname: string;
  }
}

interface CatchMindUser {
  id: string;
  points: number;
  nickname: string;
}
