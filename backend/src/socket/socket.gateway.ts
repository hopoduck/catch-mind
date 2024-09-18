import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: Server;

  handleConnection(client: Socket) {
    client.nickname = 'Anonymous';
    console.log('connected!', client.id);
  }

  handleDisconnect(client: Socket) {
    client.broadcast.emit('disconnected', { nickname: client.nickname });
    console.log('disconnected!!!', client.id);
  }

  @SubscribeMessage('setNickname')
  handleSetNickname(client: Socket, { nickname }: { nickname: string }) {
    client.nickname = nickname;
    client.broadcast.emit('newUser', { nickname });
    console.log('set new nickname!', nickname);
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(client: Socket, { message }: { message: string }) {
    client.broadcast.emit('newMessage', {
      message,
      nickname: client.nickname,
    });
    console.log('new message!', message);
  }
}
