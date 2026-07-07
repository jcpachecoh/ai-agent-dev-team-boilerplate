import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
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
import { EmployeeFinancialProfileService } from '../service/employee-financial-profile.service';
import {
  BankAccountResponseDto,
  CreateBankAccountDto,
  CreateFinancialProfileDto,
  FinancialProfileResponseDto,
  PaymentHistoryResponseDto,
  TaxInformationResponseDto,
  UpdateBankAccountDto,
  UpdateFinancialProfileDto,
  UpsertTaxInformationDto,
  toBankAccountResponse,
  toFinancialProfileResponse,
  toTaxInformationResponse,
} from './dto/financial-profile.dto';

@ApiTags('employee-financial-profile')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('employees')
export class EmployeeFinancialProfileController {
  constructor(private readonly service: EmployeeFinancialProfileService) {}

  // ── Financial Profile ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Obtener perfil financiero del empleado' })
  @ApiResponse({ status: 200, type: FinancialProfileResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('nomina.financial.read')
  @Get(':employeeId/financial-profile')
  async getProfile(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<FinancialProfileResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const profile = await this.service.getProfile(tenantId, employeeId);
    return toFinancialProfileResponse(profile);
  }

  @ApiOperation({ summary: 'Crear (o retornar existente) perfil financiero del empleado' })
  @ApiResponse({ status: 201, type: FinancialProfileResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  @Post(':employeeId/financial-profile')
  async createProfile(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: CreateFinancialProfileDto,
  ): Promise<FinancialProfileResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const profile = await this.service.getOrCreateProfile(tenantId, employeeId, user.sub, {
      paymentMethod: body.paymentMethod,
    });
    return toFinancialProfileResponse(profile);
  }

  @ApiOperation({ summary: 'Actualizar perfil financiero del empleado' })
  @ApiResponse({ status: 200, type: FinancialProfileResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  @Patch(':employeeId/financial-profile')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: UpdateFinancialProfileDto,
  ): Promise<FinancialProfileResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const profile = await this.service.updateProfile(tenantId, employeeId, user.sub, {
      paymentMethod: body.paymentMethod,
    });
    return toFinancialProfileResponse(profile);
  }

  // ── Bank Accounts ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Listar cuentas bancarias del empleado' })
  @ApiResponse({ status: 200, type: [BankAccountResponseDto] })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('nomina.financial.read')
  @Get(':employeeId/financial-profile/bank-accounts')
  async getBankAccounts(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<BankAccountResponseDto[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const accounts = await this.service.getBankAccounts(tenantId, employeeId);
    return accounts.map(toBankAccountResponse);
  }

  @ApiOperation({ summary: 'Agregar cuenta bancaria al empleado' })
  @ApiResponse({ status: 201, type: BankAccountResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  @Post(':employeeId/financial-profile/bank-accounts')
  async createBankAccount(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: CreateBankAccountDto,
  ): Promise<BankAccountResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const account = await this.service.createBankAccount(tenantId, employeeId, user.sub, {
      bankName: body.bankName.trim(),
      bankCode: body.bankCode,
      accountType: body.accountType,
      accountNumber: body.accountNumber,
      isPrimary: body.isPrimary,
    });
    return toBankAccountResponse(account);
  }

  @ApiOperation({ summary: 'Actualizar cuenta bancaria del empleado' })
  @ApiResponse({ status: 200, type: BankAccountResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  @Patch(':employeeId/financial-profile/bank-accounts/:id')
  async updateBankAccount(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() body: UpdateBankAccountDto,
  ): Promise<BankAccountResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const account = await this.service.updateBankAccount(tenantId, id, employeeId, user.sub, {
      bankName: body.bankName !== undefined ? body.bankName.trim() : undefined,
      bankCode: body.bankCode,
      accountType: body.accountType,
    });
    return toBankAccountResponse(account);
  }

  @ApiOperation({ summary: 'Eliminar (soft delete) cuenta bancaria del empleado' })
  @ApiResponse({ status: 200, type: Boolean })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  @Delete(':employeeId/financial-profile/bank-accounts/:id')
  async deleteBankAccount(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    await this.service.softDeleteBankAccount(tenantId, id, employeeId, user.sub);
    return true;
  }

  @ApiOperation({ summary: 'Marcar cuenta bancaria como primaria' })
  @ApiResponse({ status: 200, type: FinancialProfileResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  @Patch(':employeeId/financial-profile/bank-accounts/:id/set-primary')
  async setPrimaryBankAccount(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
  ): Promise<FinancialProfileResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const profile = await this.service.setPrimaryBankAccount(tenantId, id, employeeId, user.sub);
    return toFinancialProfileResponse(profile);
  }

  // ── Tax Information ───────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Obtener información fiscal del empleado' })
  @ApiResponse({ status: 200, type: TaxInformationResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('nomina.financial.tax.read')
  @Get(':employeeId/financial-profile/tax-information')
  async getTaxInformation(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<TaxInformationResponseDto | null> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const info = await this.service.getTaxInformation(tenantId, employeeId);
    return info ? toTaxInformationResponse(info) : null;
  }

  @ApiOperation({ summary: 'Crear o actualizar información fiscal del empleado' })
  @ApiResponse({ status: 200, type: TaxInformationResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.tax.write')
  @Put(':employeeId/financial-profile/tax-information')
  async upsertTaxInformation(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: UpsertTaxInformationDto,
  ): Promise<TaxInformationResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const info = await this.service.upsertTaxInformation(tenantId, employeeId, user.sub, {
      taxId: body.taxId.trim(),
      taxRegime: body.taxRegime,
      withholdingApplicable: body.withholdingApplicable,
      withholdingRate: body.withholdingRate,
    });
    return toTaxInformationResponse(info);
  }

  // ── Payment History (read-only) ───────────────────────────────────────────

  @ApiOperation({ summary: 'Consultar historial de pagos del empleado (solo lectura)' })
  @ApiResponse({ status: 200, type: [PaymentHistoryResponseDto] })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('nomina.financial.history.read')
  @Get(':employeeId/financial-profile/payment-history')
  async getPaymentHistory(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ): Promise<{
    edges: PaymentHistoryResponseDto[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const takeNum = take ? parseInt(take, 10) : 20;
    const result = await this.service.getPaymentHistory(tenantId, employeeId, cursor, takeNum);
    return {
      edges: result.edges.map((record) => ({
        id: record.id,
        tenantId: record.tenantId,
        financialProfileId: record.financialProfileId,
        bankAccountId: record.bankAccountId,
        periodYear: record.periodYear,
        periodMonth: record.periodMonth,
        grossAmount: Number(record.grossAmount),
        totalDeductions: Number(record.totalDeductions),
        netAmount: Number(record.netAmount),
        paymentDate: record.paymentDate,
        paymentMethod: record.paymentMethod,
        status: record.status,
        transactionReference: record.transactionReference,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
      pageInfo: result.pageInfo,
    };
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId ?? headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
