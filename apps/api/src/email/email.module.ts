import { Global, Module } from '@nestjs/common';
import { EmailService } from '@restopsiq/email';

@Global()
@Module({
  providers: [
    {
      provide: EmailService,
      useFactory: () =>
        new EmailService({
          redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
        }),
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
