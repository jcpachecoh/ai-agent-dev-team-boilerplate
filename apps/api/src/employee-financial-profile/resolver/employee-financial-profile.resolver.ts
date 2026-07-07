import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  Float,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import { BankAccountType, FinancialPaymentStatus, PaymentMethod } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmployeeFinancialProfileService } from '../service/employee-financial-profile.service';

// ── Enum registrations ────────────────────────────────────────────────────────

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Método de pago del empleado',
});

registerEnumType(BankAccountType, {
  name: 'BankAccountType',
  description: 'Tipo de cuenta bancaria',
});

registerEnumType(FinancialPaymentStatus, {
  name: 'FinancialPaymentStatus',
  description: 'Estado de un pago en el historial',
});

// ── ObjectTypes ───────────────────────────────────────────────────────────────

@ObjectType('EmployeeFinancialProfile')
export class EmployeeFinancialProfileType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) employeeDetailsId!: string;
  @Field(() => PaymentMethod) paymentMethod!: PaymentMethod;
  @Field(() => ID, { nullable: true }) primaryBankAccountId?: string | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  @Field(() => Date, { nullable: true }) deletedAt?: Date | null;
}

@ObjectType('EmployeeBankAccount')
export class EmployeeBankAccountType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) financialProfileId!: string;
  @Field() bankName!: string;
  @Field(() => String, { nullable: true }) bankCode?: string | null;
  @Field(() => BankAccountType) accountType!: BankAccountType;
  /** Never expose the encrypted value — only the masked display. */
  @Field() maskedAccountNumber!: string;
  @Field() accountLast4!: string;
  @Field() isPrimary!: boolean;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  @Field(() => Date, { nullable: true }) deletedAt?: Date | null;
}

@ObjectType('EmployeeTaxInformation')
export class EmployeeTaxInformationType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) financialProfileId!: string;
  /** Never expose the encrypted value — only the masked display. */
  @Field() maskedTaxId!: string;
  @Field() taxIdLast4!: string;
  @Field(() => String, { nullable: true }) taxRegime?: string | null;
  @Field() withholdingApplicable!: boolean;
  @Field(() => Float, { nullable: true }) withholdingRate?: number | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType('EmployeePaymentHistory')
export class EmployeePaymentHistoryType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) financialProfileId!: string;
  @Field(() => ID, { nullable: true }) bankAccountId?: string | null;
  @Field(() => Int) periodYear!: number;
  @Field(() => Int) periodMonth!: number;
  @Field(() => Float) grossAmount!: number;
  @Field(() => Float) totalDeductions!: number;
  @Field(() => Float) netAmount!: number;
  @Field(() => Date, { nullable: true }) paymentDate?: Date | null;
  @Field(() => PaymentMethod) paymentMethod!: PaymentMethod;
  @Field(() => FinancialPaymentStatus) status!: FinancialPaymentStatus;
  @Field(() => String, { nullable: true }) transactionReference?: string | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType('PaymentHistoryPageInfo')
export class PaymentHistoryPageInfoType {
  @Field() hasNextPage!: boolean;
  @Field(() => ID, { nullable: true }) endCursor?: string | null;
}

@ObjectType('EmployeePaymentHistoryConnection')
export class EmployeePaymentHistoryConnectionType {
  @Field(() => [EmployeePaymentHistoryType]) edges!: EmployeePaymentHistoryType[];
  @Field(() => PaymentHistoryPageInfoType) pageInfo!: PaymentHistoryPageInfoType;
}

// ── InputTypes ────────────────────────────────────────────────────────────────

@InputType()
export class CreateFinancialProfileInput {
  @Field(() => PaymentMethod, { nullable: true })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}

@InputType()
export class UpdateFinancialProfileInput {
  @Field(() => PaymentMethod, { nullable: true })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}

@InputType()
export class CreateBankAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  bankCode?: string;

  @Field(() => BankAccountType)
  @IsEnum(BankAccountType)
  accountType!: BankAccountType;

  @Field()
  @IsString()
  @Matches(/^\d{6,20}$/, {
    message: 'El número de cuenta debe contener solo dígitos (6-20 caracteres)',
  })
  accountNumber!: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

@InputType()
export class UpdateBankAccountInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  bankName?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  bankCode?: string;

  @Field(() => BankAccountType, { nullable: true })
  @IsEnum(BankAccountType)
  @IsOptional()
  accountType?: BankAccountType;
}

@InputType()
export class UpsertTaxInformationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  taxId!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  taxRegime?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  withholdingApplicable?: boolean;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  withholdingRate?: number;
}

// ── Resolver ──────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Resolver(() => EmployeeFinancialProfileType)
export class EmployeeFinancialProfileResolver {
  constructor(private readonly service: EmployeeFinancialProfileService) {}

  // ── Profile queries/mutations ─────────────────────────────────────────────

  @Query(() => EmployeeFinancialProfileType, { nullable: true })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('nomina.financial.read')
  async employeeFinancialProfile(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ): Promise<EmployeeFinancialProfileType | null> {
    const tenantId = this.resolveTenantId(user, context);
    try {
      return (await this.service.getProfile(tenantId, employeeId)) as EmployeeFinancialProfileType;
    } catch {
      return null;
    }
  }

  @Mutation(() => EmployeeFinancialProfileType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  async createEmployeeFinancialProfile(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('input', { nullable: true }) input?: CreateFinancialProfileInput,
  ): Promise<EmployeeFinancialProfileType> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.getOrCreateProfile(
      tenantId,
      employeeId,
      user.sub,
      input ?? {},
    ) as Promise<EmployeeFinancialProfileType>;
  }

  @Mutation(() => EmployeeFinancialProfileType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  async updateEmployeeFinancialProfile(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('input') input: UpdateFinancialProfileInput,
  ): Promise<EmployeeFinancialProfileType> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.updateProfile(tenantId, employeeId, user.sub, {
      paymentMethod: input.paymentMethod,
    }) as Promise<EmployeeFinancialProfileType>;
  }

  // ── Bank Account queries/mutations ────────────────────────────────────────

  @Query(() => [EmployeeBankAccountType])
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('nomina.financial.read')
  async employeeBankAccounts(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ): Promise<EmployeeBankAccountType[]> {
    const tenantId = this.resolveTenantId(user, context);
    const accounts = await this.service.getBankAccounts(tenantId, employeeId);
    return accounts.map(this.mapBankAccount);
  }

  @Mutation(() => EmployeeBankAccountType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  async createEmployeeBankAccount(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('input') input: CreateBankAccountInput,
  ): Promise<EmployeeBankAccountType> {
    const tenantId = this.resolveTenantId(user, context);
    const account = await this.service.createBankAccount(tenantId, employeeId, user.sub, {
      bankName: input.bankName.trim(),
      bankCode: input.bankCode,
      accountType: input.accountType,
      accountNumber: input.accountNumber,
      isPrimary: input.isPrimary,
    });
    return this.mapBankAccount(account);
  }

  @Mutation(() => EmployeeBankAccountType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  async updateEmployeeBankAccount(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBankAccountInput,
  ): Promise<EmployeeBankAccountType> {
    const tenantId = this.resolveTenantId(user, context);
    const account = await this.service.updateBankAccount(tenantId, id, employeeId, user.sub, {
      bankName: input.bankName !== undefined ? input.bankName.trim() : undefined,
      bankCode: input.bankCode,
      accountType: input.accountType,
    });
    return this.mapBankAccount(account);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  async deleteEmployeeBankAccount(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const tenantId = this.resolveTenantId(user, context);
    await this.service.softDeleteBankAccount(tenantId, id, employeeId, user.sub);
    return true;
  }

  @Mutation(() => EmployeeFinancialProfileType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.write')
  async setPrimaryBankAccount(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('bankAccountId', { type: () => ID }) bankAccountId: string,
  ): Promise<EmployeeFinancialProfileType> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.setPrimaryBankAccount(
      tenantId,
      bankAccountId,
      employeeId,
      user.sub,
    ) as Promise<EmployeeFinancialProfileType>;
  }

  // ── Tax Information queries/mutations ─────────────────────────────────────

  @Query(() => EmployeeTaxInformationType, { nullable: true })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('nomina.financial.tax.read')
  async employeeTaxInformation(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ): Promise<EmployeeTaxInformationType | null> {
    const tenantId = this.resolveTenantId(user, context);
    const info = await this.service.getTaxInformation(tenantId, employeeId);
    return info ? this.mapTaxInformation(info) : null;
  }

  @Mutation(() => EmployeeTaxInformationType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @RequirePermission('nomina.financial.tax.write')
  async upsertEmployeeTaxInformation(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('input') input: UpsertTaxInformationInput,
  ): Promise<EmployeeTaxInformationType> {
    const tenantId = this.resolveTenantId(user, context);
    const result = await this.service.upsertTaxInformation(tenantId, employeeId, user.sub, {
      taxId: input.taxId.trim(),
      taxRegime: input.taxRegime,
      withholdingApplicable: input.withholdingApplicable,
      withholdingRate: input.withholdingRate,
    });
    return this.mapTaxInformation(result);
  }

  // ── Payment History query ─────────────────────────────────────────────────

  @Query(() => EmployeePaymentHistoryConnectionType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('nomina.financial.history.read')
  async employeePaymentHistory(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('take', { type: () => Int, defaultValue: 20 }) take?: number,
  ): Promise<EmployeePaymentHistoryConnectionType> {
    const tenantId = this.resolveTenantId(user, context);
    const result = await this.service.getPaymentHistory(tenantId, employeeId, cursor, take);
    return {
      edges: result.edges.map(this.mapPaymentHistory),
      pageInfo: result.pageInfo,
    };
  }

  // ── Mappers ───────────────────────────────────────────────────────────────

  private mapBankAccount(
    account: import('@prisma/client').EmployeeBankAccount,
  ): EmployeeBankAccountType {
    return {
      id: account.id,
      tenantId: account.tenantId,
      financialProfileId: account.financialProfileId,
      bankName: account.bankName,
      bankCode: account.bankCode,
      accountType: account.accountType,
      maskedAccountNumber: `****${account.accountLast4}`,
      accountLast4: account.accountLast4,
      isPrimary: account.isPrimary,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      deletedAt: account.deletedAt,
    };
  }

  private mapTaxInformation(
    info: import('@prisma/client').EmployeeTaxInformation,
  ): EmployeeTaxInformationType {
    return {
      id: info.id,
      tenantId: info.tenantId,
      financialProfileId: info.financialProfileId,
      maskedTaxId: `****${info.taxIdLast4}`,
      taxIdLast4: info.taxIdLast4,
      taxRegime: info.taxRegime,
      withholdingApplicable: info.withholdingApplicable,
      withholdingRate: info.withholdingRate ? Number(info.withholdingRate) : null,
      createdAt: info.createdAt,
      updatedAt: info.updatedAt,
    };
  }

  private mapPaymentHistory(
    record: import('@prisma/client').EmployeePaymentHistory,
  ): EmployeePaymentHistoryType {
    return {
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
    };
  }

  private resolveTenantId(user: JwtPayload, context: GqlRequestContext): string {
    if (user?.tenantId) return user.tenantId;
    return getTenantIdFromContext(context);
  }
}
