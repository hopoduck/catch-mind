import { Module } from '@nestjs/common';
import { SocketGateway } from './socket/socket.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [SocketGateway],
})
export class AppModule {}
