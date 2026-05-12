import { Module } from '@nestjs/common';
import { RunsController } from './controller/runs.controller';
import { RunsService } from './service/runs.service';
import { RunsRepository } from './repository/runs.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RunsController],
  providers: [RunsRepository, RunsService],
})
export class RunsModule {}
