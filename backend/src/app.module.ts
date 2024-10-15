import { Module } from '@nestjs/common';
import { MetricsModule } from './metrics/metrics.module';
import { SocketGateway } from './socket/socket.gateway';

@Module({
  imports: [MetricsModule],
  controllers: [],
  providers: [SocketGateway],
})
export class AppModule {}
