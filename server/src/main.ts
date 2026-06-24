import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🎮 Imposter Game Server running on http://localhost:${port}`);
}
bootstrap();
