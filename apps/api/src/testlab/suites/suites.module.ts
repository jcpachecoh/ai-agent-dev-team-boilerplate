import { Module } from '@nestjs/common';
import { SuitesController } from './controller/suites.controller';
import { SuitesService } from './service/suites.service';
import { SuitesRepository } from './repository/suites.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SuitesController],
  providers: [SuitesRepository, SuitesService],
})
export class SuitesModule {}
