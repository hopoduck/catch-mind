import 'socket.io';

declare module 'socket.io' {
  export interface Socket {
    nickname: string;
  }
}

interface CatchMindUser {
  id: string;
  points: number;
  nickname: string;
}
