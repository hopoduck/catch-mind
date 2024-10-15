import { Gauge } from 'prom-client';

export const connectedUserCount = new Gauge({
  name: 'socket_connected_user_count',
  help: '소켓 연결 된 유저 수',
});
export const sessionCount = new Gauge({
  name: 'session_count',
  help: '진행중인 방(세션) 개수',
});
export const sendMessageData = new Gauge({
  name: 'send_message_data',
  help: '전송한 메시지 데이터',
});
