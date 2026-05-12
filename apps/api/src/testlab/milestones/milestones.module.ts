import { Module } from '@nestjs/common';
import { MilestonesController } from './controller/milestones.controller';
import { MilestonesService } from './service/milestones.service';
import { MilestonesRepository } from './repository/milestones.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MilestonesController],
  providers: [MilestonesRepository, MilestonesService],
})
export class MilestonesModule {}
