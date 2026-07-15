import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { IndemnificationFormulaValidationRecord } from '../interfaces/legal-formula-validation.interfaces';
import { LegalFormulaValidationService } from '../service/legal-formula-validation.service';
import { ValidateLegalFormulaDto } from './dto/validate-legal-formula.dto';

/**
 * OS-591 (fase 3) — Validación legal de la fórmula de indemnización. Ver tasks/OS-591.md
 * §15.1. Independiente del estado operativo de cualquier `FinalSettlement`.
 */
@ApiTags('legal-formula-validations')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('legal-formula-validations')
export class LegalFormulaValidationController {
  constructor(private readonly legalFormulaValidationService: LegalFormulaValidationService) {}

  @ApiOperation({
    summary: 'Registrar la validación legal de una versión de fórmula de indemnización',
  })
  @ApiResponse({ status: 201 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.validate_legal_formula')
  @Post()
  async validate(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: ValidateLegalFormulaDto,
  ): Promise<IndemnificationFormulaValidationRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    if (!user?.sub) {
      throw new BadRequestException('No se pudo determinar el usuario autenticado (validatedBy)');
    }
    return this.legalFormulaValidationService.validate({
      tenantId,
      formulaVersion: body.formulaVersion,
      legalReference: body.legalReference,
      observations: body.observations,
      validatedBy: user.sub,
      validatedAt: new Date(),
    });
  }

  @ApiOperation({ summary: 'Listar el historial de validaciones legales del tenant' })
  @ApiResponse({ status: 200 })
  @RequirePermission('nomina.settlement.read')
  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
  ): Promise<IndemnificationFormulaValidationRecord[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.legalFormulaValidationService.listByTenant(tenantId);
  }

  @ApiOperation({ summary: 'Consultar la validación ACTIVA para una versión de fórmula' })
  @ApiResponse({ status: 200 })
  @RequirePermission('nomina.settlement.read')
  @Get('active/:formulaVersion')
  async findActive(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('formulaVersion') formulaVersion: string,
  ): Promise<IndemnificationFormulaValidationRecord | null> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.legalFormulaValidationService.findActive(tenantId, Number(formulaVersion));
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
