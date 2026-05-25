import { Module } from '@nestjs/common';
import { Version3Client } from 'jira.js';
import { GenerationController } from './controller/generation.controller';
import { GenerationService, JIRA_CLIENT } from './service/generation.service';
import { GenerationRepository } from './repository/generation.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GenerationController],
  providers: [
    GenerationRepository,
    {
      provide: JIRA_CLIENT,
      useFactory: (): Version3Client | null => {
        const host = process.env.JIRA_URL ?? '';
        if (!host || !host.startsWith('http')) return null;
        return new Version3Client({
          host,
          authentication: {
            basic: {
              email: process.env.JIRA_USERNAME ?? '',
              apiToken: process.env.JIRA_API_TOKEN ?? '',
            },
          },
        });
      },
    },
    GenerationService,
  ],
})
export class GenerationModule {}
