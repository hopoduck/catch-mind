import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT, () => {
    // c 입력 시 나눔용 줄 출력
    if (process.env.NODE_ENV === 'development') {
      let used = false;
      process.stdin.setRawMode(true);
      process.stdin.on('data', (data) => {
        used = true;
        const char = data.toString();
        if (char === 'c') {
          console.log('-'.repeat(process.stdout.columns ?? 20));
        } else if (char === '\u0003') {
          process.exit();
        } else if (!used) {
          used = false;
          process.stdin.emit('data', data);
        }
      });
    }
  });
}
bootstrap();
