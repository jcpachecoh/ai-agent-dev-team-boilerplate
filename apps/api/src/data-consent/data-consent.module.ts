import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DataConsentRepository } from './repository/data-consent.repository';
import { DataConsentResolver } from './resolver/data-consent.resolver';
import { DataConsentService } from './service/data-consent.service';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  providers: [DataConsentService, DataConsentRepository, DataConsentResolver],
  exports: [DataConsentService],
})
export class DataConsentModule {}
