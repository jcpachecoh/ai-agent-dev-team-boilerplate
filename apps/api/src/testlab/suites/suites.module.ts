import { Module } from '@nestjs/common';
import { SuitesController } from './suites.controller';
import { SuitesService } from './suites.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SuitesController],
  providers: [SuitesService],
})
export class SuitesModule {}
