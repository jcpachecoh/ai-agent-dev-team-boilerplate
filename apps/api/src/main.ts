import { NestFactory } from '@nestjs/core';
import { BadRequestException, RequestMethod, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.flatMap((e) =>
          e.constraints ? Object.values(e.constraints) : [`${e.property} failed validation`],
        );
        return new BadRequestException(messages);
      },
    }),
  );

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const isProduction = process.env.NODE_ENV === 'production';
  const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  /** Capacitor WebView origins (iOS: capacitor://, Android: https://localhost) */
  const capacitorOriginPattern = /^(capacitor|ionic):\/\/localhost$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (!isProduction && localhostOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }
      if (
        !isProduction &&
        (capacitorOriginPattern.test(origin) || origin === 'https://localhost')
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    // Content-Disposition no es safelist CORS; sin esto el FE no puede leer el nombre del archivo.
    exposedHeaders: [
      'Content-Disposition',
      'Content-Type',
      'X-Content-Checksum-SHA256',
      'X-Cesantias-Export-Skipped-Count',
    ],
  });

  const config = new DocumentBuilder()
    .setTitle('RestOpsIQ API')
    .setDescription('RestOpsIQ platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
    .addTag('auth', 'Authentication')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
