import { Counter, Gauge } from 'prom-client';

export default class Metrics {
  public static readonly joinUserCount = new Counter({
    name: 'join_user_count',
    help: '게임에 참여한 유저 수',
    labelNames: ['socket', 'user'],
  });
  public static readonly connectedUserCount = new Gauge({
    name: 'socket_connected_user_count',
    help: '소켓 연결 된 유저 수',
    labelNames: ['socket', 'user'],
  });
  public static readonly sessionCount = new Gauge({
    name: 'session_count',
    help: '진행중인 방(세션) 개수',
    labelNames: ['socket', 'room'],
  });
  public static readonly startGameCount = new Counter({
    name: 'start_game_count',
    help: '시작된 게임 수',
    labelNames: ['socket', 'game'],
  });
  public static readonly winnerExistGameCount = new Counter({
    name: 'winner_exist_game_count',
    help: '정답자가 있는 게임 수',
    labelNames: ['socket', 'game', 'user'],
  });
  public static readonly sendMessageCount = new Counter({
    name: 'send_message_count',
    help: '전송한 메시지 수',
    labelNames: ['socket', 'message'],
  });
}
