import { Module } from '@nestjs/common';
import { RequirementsController } from './controller/requirements.controller';
import { RequirementsService } from './service/requirements.service';
import { RequirementsRepository } from './repository/requirements.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RequirementsController],
  providers: [RequirementsRepository, RequirementsService],
})
export class RequirementsModule {}
