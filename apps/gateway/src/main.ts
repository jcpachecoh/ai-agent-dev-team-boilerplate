import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new FastifyAdapter({ logger: false }), {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  await app.listen(process.env['PORT'] ?? 4000, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
