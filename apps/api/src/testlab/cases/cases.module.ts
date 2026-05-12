import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CasesController } from './controller/cases.controller';
import { CasesService } from './service/cases.service';
import { CasesRepository } from './repository/cases.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CasesController],
  providers: [CasesRepository, CasesService],
})
export class CasesModule {}
