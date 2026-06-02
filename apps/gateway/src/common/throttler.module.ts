import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './throttler.guard';
import { APP_GUARD } from '@nestjs/core';
import { env } from '../config/env';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Math.ceil(env.RATE_LIMIT_WINDOW / 1000),
        limit: env.RATE_LIMIT_MAX_REQUESTS,
      },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: GqlThrottlerGuard }],
  exports: [ThrottlerModule],
})
export class CommonThrottlerModule {}
