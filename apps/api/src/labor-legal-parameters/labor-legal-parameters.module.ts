import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LaborLegalParametersRepository } from './repository/labor-legal-parameters.repository';
import { LaborLegalParametersResolver } from './resolver/labor-legal-parameters.resolver';
import { LaborLegalParametersService } from './service/labor-legal-parameters.service';

@Module({
  // AuthModule re-exports PermissionsModule/PermissionsGuard/RolesGuard — required for
  // @UseGuards(RolesGuard, PermissionsGuard) in the resolver to resolve PermissionsService.
  imports: [PrismaModule, AuditModule, AuthModule],
  providers: [
    LaborLegalParametersService,
    LaborLegalParametersRepository,
    LaborLegalParametersResolver,
  ],
  exports: [LaborLegalParametersService],
})
export class LaborLegalParametersModule {}
