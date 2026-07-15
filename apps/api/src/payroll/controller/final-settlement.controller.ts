import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type {
  FinalSettlementRecord,
  ManualSettlementInput,
  SettlementAggregateResult,
} from '../interfaces/final-settlement.interfaces';
import type { PendingSalaryReconciliationRecord } from '../interfaces/pending-salary-reconciliation.interfaces';
import { FinalSettlementReceiptPdfService } from '../service/final-settlement-receipt-pdf.service';
import { FinalSettlementService } from '../service/final-settlement.service';
import { PendingSalaryReconciliationService } from '../service/pending-salary-reconciliation.service';
import { CalculateSettlementDto } from './dto/calculate-settlement.dto';
import { ManualSettlementDto } from './dto/manual-settlement.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { PreviewSettlementDto } from './dto/preview-settlement.dto';
import { ReconcilePendingSalaryDto } from './dto/reconcile-pending-salary.dto';
import { VoidSettlementDto } from './dto/void-settlement.dto';

/**
 * OS-591 (fase 3) — API de liquidación definitiva de contrato. Ver tasks/OS-591.md §15.
 * Permisos granulares (`nomina.settlement.*`) vía `@RequirePermission` + `PermissionsGuard`
 * — no el `@Roles` de grano grueso que usa el resto de `payroll/` (separación de
 * funciones: quien calcula no necesariamente aprueba/paga/anula).
 */
@ApiTags('final-settlements')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('final-settlements')
export class FinalSettlementController {
  constructor(
    private readonly finalSettlementService: FinalSettlementService,
    private readonly pendingSalaryReconciliationService: PendingSalaryReconciliationService,
    private readonly receiptPdfService: FinalSettlementReceiptPdfService,
  ) {}

  @ApiOperation({ summary: 'Previsualizar liquidación definitiva (sin persistir)' })
  @ApiResponse({ status: 200 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.calculate')
  @Post('preview')
  async preview(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: PreviewSettlementDto,
  ): Promise<SettlementAggregateResult> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.finalSettlementService.preview({
      tenantId,
      employeeDetailsId: body.employeeDetailsId,
      effectiveTerminationDate: new Date(body.effectiveTerminationDate),
      terminationReason: body.terminationReason,
      estimatedRemainingDays: body.estimatedRemainingDays ?? null,
      estimatedRemainingDaysJustification: body.estimatedRemainingDaysJustification ?? null,
    });
  }

  @ApiOperation({ summary: 'Calcular y persistir una liquidación definitiva (AUTOMATIC/MANUAL)' })
  @ApiResponse({ status: 201 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.calculate')
  @Post('calculate')
  async calculate(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CalculateSettlementDto,
  ): Promise<FinalSettlementRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.finalSettlementService.calculateAndSave({
      tenantId,
      employeeDetailsId: body.employeeDetailsId,
      effectiveTerminationDate: new Date(body.effectiveTerminationDate),
      terminationReason: body.terminationReason,
      estimatedRemainingDays: body.estimatedRemainingDays ?? null,
      estimatedRemainingDaysJustification: body.estimatedRemainingDaysJustification ?? null,
      mode: body.mode,
      acceptedWarnings: body.acceptedWarnings,
      manualJustification: body.manualJustification,
      manualReference: body.manualReference,
      manualResponsible: body.manualResponsible,
      createdBy: user?.sub,
    });
  }

  @ApiOperation({ summary: 'Registrar una liquidación definitiva manual' })
  @ApiResponse({ status: 201 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.manual')
  @Post('manual')
  async createManual(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: ManualSettlementDto,
  ): Promise<FinalSettlementRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.finalSettlementService.createManual({
      tenantId,
      employeeDetailsId: body.employeeDetailsId,
      effectiveTerminationDate: new Date(body.effectiveTerminationDate),
      terminationReason: body.terminationReason,
      lines: body.lines.map((l): ManualSettlementInput['lines'][number] => ({
        code: l.code,
        name: l.name,
        type: l.type,
        amount: new Prisma.Decimal(l.amount),
        manualJustification: l.manualJustification,
        metadata: l.metadata,
        sortOrder: l.sortOrder,
      })),
      manualJustification: body.manualJustification,
      manualReference: body.manualReference,
      manualResponsible: body.manualResponsible,
      createdBy: user?.sub,
    });
  }

  @ApiOperation({ summary: 'Recalcular una liquidación CALCULATED' })
  @ApiResponse({ status: 200 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.calculate')
  @Post(':id/recalculate')
  async recalculate(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<FinalSettlementRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.finalSettlementService.recalculate(tenantId, id, user?.sub);
  }

  @ApiOperation({ summary: 'Aprobar una liquidación CALCULATED (termina el contrato activo)' })
  @ApiResponse({ status: 200 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.approve')
  @Post(':id/approve')
  async approve(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<FinalSettlementRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    if (!user?.sub) {
      throw new BadRequestException('No se pudo determinar el usuario autenticado (approvedBy)');
    }
    return this.finalSettlementService.approve(tenantId, id, user.sub);
  }

  @ApiOperation({ summary: 'Marcar como pagada una liquidación APPROVED' })
  @ApiResponse({ status: 200 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.pay')
  @Post(':id/pay')
  async pay(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: MarkPaidDto,
  ): Promise<FinalSettlementRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    if (!user?.sub) {
      throw new BadRequestException('No se pudo determinar el usuario autenticado (paidBy)');
    }
    return this.finalSettlementService.markPaid(tenantId, id, {
      paidBy: user.sub,
      paymentReference: body.paymentReference,
      paymentDate: new Date(body.paymentDate),
    });
  }

  @ApiOperation({ summary: 'Anular una liquidación DRAFT/CALCULATED' })
  @ApiResponse({ status: 200 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.void')
  @Post(':id/void')
  async voidSettlement(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: VoidSettlementDto,
  ): Promise<FinalSettlementRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.finalSettlementService.void(tenantId, id, body.voidReason, user?.sub);
  }

  @ApiOperation({
    summary: 'Registrar la reconciliación auditable de salario pendiente de una liquidación',
  })
  @ApiResponse({ status: 201 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.settlement.reconcile_pending_salary')
  @Post(':id/pending-salary-reconciliation')
  async reconcilePendingSalary(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: ReconcilePendingSalaryDto,
  ): Promise<PendingSalaryReconciliationRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.pendingSalaryReconciliationService.reconcile({
      tenantId,
      settlementId: id,
      previouslyPaidAmount: body.previouslyPaidAmount,
      paymentReference: body.paymentReference,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
      responsible: body.responsible,
      observation: body.observation,
      recognizedBalance: body.recognizedBalance,
      createdBy: user?.sub,
    });
  }

  @ApiOperation({ summary: 'Consultar la reconciliación de salario pendiente de una liquidación' })
  @ApiResponse({ status: 200 })
  @RequirePermission('nomina.settlement.read')
  @Get(':id/pending-salary-reconciliation')
  async getPendingSalaryReconciliation(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<PendingSalaryReconciliationRecord | null> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.pendingSalaryReconciliationService.findBySettlement(tenantId, id);
  }

  @ApiOperation({ summary: 'Listar liquidaciones definitivas de un empleado' })
  @ApiResponse({ status: 200 })
  @RequirePermission('nomina.settlement.read')
  @Get('employee/:employeeDetailsId')
  async listByEmployee(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeDetailsId') employeeDetailsId: string,
  ): Promise<FinalSettlementRecord[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.finalSettlementService.findAllByEmployee(tenantId, employeeDetailsId);
  }

  @ApiOperation({ summary: 'Detalle de una liquidación definitiva' })
  @ApiResponse({ status: 200 })
  @RequirePermission('nomina.settlement.read')
  @Get(':id')
  async detail(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<FinalSettlementRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.finalSettlementService.findById(tenantId, id);
  }

  @ApiOperation({
    summary:
      'Descargar el comprobante PDF de una liquidación definitiva (CALCULATED/APPROVED/PAID)',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200 })
  @RequirePermission('nomina.settlement.read')
  @Get(':id/receipt')
  async downloadReceipt(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const { buffer, filename } = await this.receiptPdfService.generateReceiptPdf(
      tenantId,
      id,
      user?.sub ?? 'system',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
