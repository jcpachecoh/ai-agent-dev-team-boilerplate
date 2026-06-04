import { Module } from '@nestjs/common';
import { Version3Client } from 'jira.js';
import { JiraController } from './controller/jira.controller';
import { JiraService, JIRA_CLIENT } from './service/jira.service';
import { JiraRepository } from './repository/jira.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JiraController],
  providers: [
    JiraRepository,
    {
      provide: JIRA_CLIENT,
      useFactory: (): Version3Client =>
        new Version3Client({
          host: process.env.JIRA_URL ?? '',
          authentication: {
            basic: {
              email: process.env.JIRA_USERNAME ?? '',
              apiToken: process.env.JIRA_API_TOKEN ?? '',
            },
          },
        }),
    },
    JiraService,
  ],
  exports: [JiraService],
})
export class JiraModule {}
