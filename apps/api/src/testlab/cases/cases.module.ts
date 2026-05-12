import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  imports: [PrismaModule],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
