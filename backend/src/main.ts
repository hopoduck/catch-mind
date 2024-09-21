import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT, () => {
    // c 입력 시 나눔용 줄 출력
    process.stdin.on('data', (data) => {
      if (data.toString() === 'c') {
        console.log('-'.repeat(process.stdout.columns ?? 20));
      }
    });
  });
}
bootstrap();
