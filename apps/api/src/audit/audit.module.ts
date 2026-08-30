import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditRepository } from './repository/audit.repository';
import { AuditService } from './service/audit.service';
import { AuditController } from './controller/audit.controller';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditRepository, AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
