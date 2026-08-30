import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { EmailService, EmailWorker } from '@restopsiq/email';

const EMAIL_WORKER_TOKEN = 'EMAIL_WORKER';

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
    {
      provide: EMAIL_WORKER_TOKEN,
      useFactory: () => {
        const resendApiKey = process.env.RESEND_API_KEY ?? '';
        const fromAddress = process.env.EMAIL_FROM ?? '';
        const fromName = process.env.RESEND_FROM_NAME;
        const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

        if (!resendApiKey || !fromAddress) {
          return null;
        }

        return new EmailWorker({ redisUrl, resendApiKey, fromAddress, fromName });
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailModule.name);

  constructor(@Optional() @Inject(EMAIL_WORKER_TOKEN) private readonly emailWorker: EmailWorker | null) {}

  onModuleInit() {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      this.logger.warn(
        'EmailWorker NOT started — RESEND_API_KEY o EMAIL_FROM no están configurados. ' +
          'Los emails quedarán encolados pero no se enviarán.',
      );
      return;
    }

    this.logger.log(
      `EmailWorker iniciado — From: ${process.env.RESEND_FROM_NAME ?? ''} <${process.env.EMAIL_FROM}>`,
    );
  }

  async onModuleDestroy() {
    if (this.emailWorker) {
      await this.emailWorker.close();
      this.logger.log('EmailWorker cerrado correctamente.');
    }
  }
}
