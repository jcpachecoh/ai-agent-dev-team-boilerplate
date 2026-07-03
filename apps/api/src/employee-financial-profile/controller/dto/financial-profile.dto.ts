import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BankAccountType,
  EmployeeBankAccount,
  EmployeeFinancialProfile,
  EmployeeTaxInformation,
  FinancialPaymentStatus,
  PaymentMethod,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

// ── Request DTOs ──────────────────────────────────────────────────────────────

export class CreateFinancialProfileDto {
  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}

export class UpdateFinancialProfileDto {
  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}

export class CreateBankAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankCode?: string;

  @ApiProperty({ enum: BankAccountType })
  @IsEnum(BankAccountType)
  accountType!: BankAccountType;

  @ApiProperty({ description: 'Plain account number (6-20 digits)' })
  @IsString()
  @Matches(/^\d{6,20}$/, {
    message: 'El número de cuenta debe contener solo dígitos (6-20 caracteres)',
  })
  accountNumber!: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateBankAccountDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankCode?: string;

  @ApiPropertyOptional({ enum: BankAccountType })
  @IsEnum(BankAccountType)
  @IsOptional()
  accountType?: BankAccountType;
}

export class UpsertTaxInformationDto {
  @ApiProperty({ description: 'Plain NIT/RUT del empleado' })
  @IsString()
  @IsNotEmpty()
  taxId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taxRegime?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  withholdingApplicable?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  withholdingRate?: number;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export class FinancialProfileResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeDetailsId!: string;
  @ApiProperty({ enum: PaymentMethod }) paymentMethod!: PaymentMethod;
  @ApiPropertyOptional() primaryBankAccountId?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date | null;
}

export class BankAccountResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() financialProfileId!: string;
  @ApiProperty() bankName!: string;
  @ApiPropertyOptional() bankCode?: string | null;
  @ApiProperty({ enum: BankAccountType }) accountType!: BankAccountType;
  @ApiProperty({ description: 'Número enmascarado (****XXXX)' }) maskedAccountNumber!: string;
  @ApiProperty() accountLast4!: string;
  @ApiProperty() isPrimary!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date | null;
}

export class TaxInformationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() financialProfileId!: string;
  @ApiProperty({ description: 'NIT/RUT enmascarado (****XXXX)' }) maskedTaxId!: string;
  @ApiProperty() taxIdLast4!: string;
  @ApiPropertyOptional() taxRegime?: string | null;
  @ApiProperty() withholdingApplicable!: boolean;
  @ApiPropertyOptional() withholdingRate?: number | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaymentHistoryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() financialProfileId!: string;
  @ApiPropertyOptional() bankAccountId?: string | null;
  @ApiProperty() periodYear!: number;
  @ApiProperty() periodMonth!: number;
  @ApiProperty() grossAmount!: number;
  @ApiProperty() totalDeductions!: number;
  @ApiProperty() netAmount!: number;
  @ApiPropertyOptional() paymentDate?: Date | null;
  @ApiProperty({ enum: PaymentMethod }) paymentMethod!: PaymentMethod;
  @ApiProperty({ enum: FinancialPaymentStatus }) status!: FinancialPaymentStatus;
  @ApiPropertyOptional() transactionReference?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function toFinancialProfileResponse(
  profile: EmployeeFinancialProfile,
): FinancialProfileResponseDto {
  return {
    id: profile.id,
    tenantId: profile.tenantId,
    employeeDetailsId: profile.employeeDetailsId,
    paymentMethod: profile.paymentMethod,
    primaryBankAccountId: profile.primaryBankAccountId,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    deletedAt: profile.deletedAt,
  };
}

export function toBankAccountResponse(account: EmployeeBankAccount): BankAccountResponseDto {
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

export function toTaxInformationResponse(info: EmployeeTaxInformation): TaxInformationResponseDto {
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
