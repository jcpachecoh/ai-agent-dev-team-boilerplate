import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TurnosController } from './controller/turnos.controller';
import { TurnosRepository } from './repository/turnos.repository';
import { TurnosExcelService } from './service/turnos-excel.service';
import { TurnosService } from './service/turnos.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TurnosController],
  providers: [TurnosService, TurnosRepository, TurnosExcelService],
  exports: [TurnosService],
})
export class TurnosModule {}
