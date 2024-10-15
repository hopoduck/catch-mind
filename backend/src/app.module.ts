import { Module } from '@nestjs/common';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsService } from './metrics/metrics.service';
import { SocketGateway } from './socket/socket.gateway';

@Module({
  imports: [MetricsModule],
  controllers: [],
  providers: [SocketGateway, MetricsService],
})
export class AppModule {}
