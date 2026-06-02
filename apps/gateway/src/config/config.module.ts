import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { env } from './env';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: () => {
        // Zod validation already ran at import time in env.ts
        // If we reach here the env is valid
        return env;
      },
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
