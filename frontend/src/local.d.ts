import { SystemChatEventType } from "./components/ChatLog";

interface ChatData {
  id: string;
  nickname?: string;
  message?: string;
  system?: SystemChatEventType;
}

interface Player {
  id: string;
  nickname: string;
  points: number;
}
