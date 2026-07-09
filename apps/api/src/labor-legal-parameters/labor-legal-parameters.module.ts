import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LaborLegalParametersRepository } from './repository/labor-legal-parameters.repository';
import { LaborLegalParametersResolver } from './resolver/labor-legal-parameters.resolver';
import { LaborLegalParametersService } from './service/labor-legal-parameters.service';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [
    LaborLegalParametersService,
    LaborLegalParametersRepository,
    LaborLegalParametersResolver,
  ],
  exports: [LaborLegalParametersService],
})
export class LaborLegalParametersModule {}
