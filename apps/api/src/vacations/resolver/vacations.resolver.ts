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
import { VacationStatus, VacationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type {
  VacationBalanceRecord,
  VacationRequestRecord,
  VacationRequestSummary,
} from '../interfaces/vacations.interfaces';
import { VacationsService } from '../service/vacations.service';

registerEnumType(VacationType, {
  name: 'VacationType',
  description: 'Tipo de solicitud de vacaciones',
});

registerEnumType(VacationStatus, {
  name: 'VacationStatus',
  description: 'Estado de la solicitud de vacaciones',
});

function parseCalendarDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function decimalToNumber(value: Decimal): number {
  return Number(value.toString());
}

function mapBalance(record: VacationBalanceRecord): VacationBalanceType {
  const available = record.accruedDays.minus(record.takenDays).minus(record.compensatedDays);
  return {
    id: record.id,
    employeeId: record.employeeId,
    accruedDays: decimalToNumber(record.accruedDays),
    takenDays: decimalToNumber(record.takenDays),
    compensatedDays: decimalToNumber(record.compensatedDays),
    availableDays: decimalToNumber(available),
    lastAccrualDate: record.lastAccrualDate,
  };
}

function mapRequest(record: VacationRequestRecord): VacationRequestType {
  return {
    id: record.id,
    employeeId: record.employeeId,
    startDate: record.startDate,
    endDate: record.endDate,
    daysRequested: decimalToNumber(record.daysRequested),
    type: record.type,
    status: record.status,
    level1ApprovedBy: record.level1ApprovedBy,
    level1ActedAt: record.level1ActedAt,
    level2ApprovedBy: record.level2ApprovedBy,
    level2ActedAt: record.level2ActedAt,
    rejectionReason: record.rejectionReason,
    letterStorageObjectId: record.letterStorageObjectId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapRequestSummary(record: VacationRequestSummary): VacationRequestSummaryType {
  return {
    ...mapRequest(record),
    employeeName: record.employeeName,
    locationId: record.locationId,
    locationName: record.locationName,
  };
}

@ObjectType('VacationBalance')
export class VacationBalanceType {
  @Field(() => ID) id!: string;
  @Field(() => ID) employeeId!: string;
  @Field(() => Float) accruedDays!: number;
  @Field(() => Float) takenDays!: number;
  @Field(() => Float) compensatedDays!: number;
  @Field(() => Float) availableDays!: number;
  @Field() lastAccrualDate!: Date;
}

@ObjectType('VacationRequest')
export class VacationRequestType {
  @Field(() => ID) id!: string;
  @Field(() => ID) employeeId!: string;
  @Field() startDate!: Date;
  @Field() endDate!: Date;
  @Field(() => Float) daysRequested!: number;
  @Field(() => VacationType) type!: VacationType;
  @Field(() => VacationStatus) status!: VacationStatus;
  @Field(() => ID, { nullable: true }) level1ApprovedBy!: string | null;
  @Field(() => Date, { nullable: true }) level1ActedAt!: Date | null;
  @Field(() => ID, { nullable: true }) level2ApprovedBy!: string | null;
  @Field(() => Date, { nullable: true }) level2ActedAt!: Date | null;
  @Field(() => String, { nullable: true }) rejectionReason!: string | null;
  @Field(() => ID, { nullable: true }) letterStorageObjectId!: string | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType('VacationRequestSummary')
export class VacationRequestSummaryType extends VacationRequestType {
  @Field() employeeName!: string;
  @Field(() => ID, { nullable: true }) locationId!: string | null;
  @Field(() => String, { nullable: true }) locationName!: string | null;
}

@ObjectType('VacationLetterUrl')
export class VacationLetterUrlType {
  @Field() url!: string;
}

@InputType('RequestVacationInput')
export class RequestVacationInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @Field()
  @IsDateString()
  startDate!: string;

  @Field()
  @IsDateString()
  endDate!: string;

  @Field(() => VacationType)
  @IsEnum(VacationType)
  type!: VacationType;
}

@InputType('MyRequestVacationInput')
export class MyRequestVacationInputType {
  @Field()
  @IsDateString()
  startDate!: string;

  @Field()
  @IsDateString()
  endDate!: string;

  @Field(() => VacationType)
  @IsEnum(VacationType)
  type!: VacationType;
}

@InputType('RejectVacationInput')
export class RejectVacationInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}

@UseGuards(JwtAuthGuard)
@Resolver()
export class VacationsResolver {
  constructor(private readonly vacationsService: VacationsService) {}

  @Query(() => VacationBalanceType)
  async myVacationBalance(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
  ): Promise<VacationBalanceType> {
    const tenantId = this.resolveTenantId(user, context);
    const balance = await this.vacationsService.getMyBalance(tenantId, user.sub);
    return mapBalance(balance);
  }

  @Query(() => VacationBalanceType)
  async vacationBalance(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ): Promise<VacationBalanceType> {
    const tenantId = this.resolveTenantId(user, context);
    await this.vacationsService.assertCanViewEmployee(tenantId, user.sub, employeeId);
    const balance = await this.vacationsService.getBalance(tenantId, employeeId);
    return mapBalance(balance);
  }

  @Query(() => [VacationRequestSummaryType])
  async myVacationRequests(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('status', { type: () => VacationStatus, nullable: true }) status?: VacationStatus,
    @Args('dateFrom', { type: () => String, nullable: true }) dateFrom?: string,
    @Args('dateTo', { type: () => String, nullable: true }) dateTo?: string,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<VacationRequestSummaryType[]> {
    const tenantId = this.resolveTenantId(user, context);
    const records = await this.vacationsService.listMyRequests(tenantId, user.sub, {
      status,
      dateFrom: dateFrom ? parseCalendarDateInput(dateFrom) : undefined,
      dateTo: dateTo ? parseCalendarDateInput(dateTo) : undefined,
      cursor,
      take,
    });
    return records.map(mapRequestSummary);
  }

  @Query(() => [VacationRequestSummaryType])
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  async vacationRequests(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID, nullable: true }) employeeId?: string,
    @Args('locationId', { type: () => ID, nullable: true }) locationId?: string,
    @Args('status', { type: () => VacationStatus, nullable: true }) status?: VacationStatus,
    @Args('dateFrom', { type: () => String, nullable: true }) dateFrom?: string,
    @Args('dateTo', { type: () => String, nullable: true }) dateTo?: string,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<VacationRequestSummaryType[]> {
    const tenantId = this.resolveTenantId(user, context);
    const records = await this.vacationsService.listRequests(tenantId, {
      employeeId,
      locationId,
      status,
      dateFrom: dateFrom ? parseCalendarDateInput(dateFrom) : undefined,
      dateTo: dateTo ? parseCalendarDateInput(dateTo) : undefined,
      cursor,
      take,
    });
    return records.map(mapRequestSummary);
  }

  @Query(() => VacationLetterUrlType)
  async vacationLetterUrl(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('requestId', { type: () => ID }) requestId: string,
  ): Promise<VacationLetterUrlType> {
    const tenantId = this.resolveTenantId(user, context);
    const url = await this.vacationsService.getLetterUrl(tenantId, user.sub, requestId);
    return { url };
  }

  @Mutation(() => VacationRequestType)
  async requestVacation(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: RequestVacationInputType,
  ): Promise<VacationRequestType> {
    const tenantId = this.resolveTenantId(user, context);
    const record = await this.vacationsService.requestVacation(tenantId, user.sub, {
      employeeId: input.employeeId,
      startDate: parseCalendarDateInput(input.startDate),
      endDate: parseCalendarDateInput(input.endDate),
      type: input.type,
    });
    return mapRequest(record);
  }

  @Mutation(() => VacationRequestType)
  async myRequestVacation(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: MyRequestVacationInputType,
  ): Promise<VacationRequestType> {
    const tenantId = this.resolveTenantId(user, context);
    const balance = await this.vacationsService.getMyBalance(tenantId, user.sub);
    const record = await this.vacationsService.requestVacation(tenantId, user.sub, {
      employeeId: balance.employeeId,
      startDate: parseCalendarDateInput(input.startDate),
      endDate: parseCalendarDateInput(input.endDate),
      type: input.type,
    });
    return mapRequest(record);
  }

  @Mutation(() => VacationRequestType)
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  async approveVacationLevel1(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('requestId', { type: () => ID }) requestId: string,
  ): Promise<VacationRequestType> {
    const tenantId = this.resolveTenantId(user, context);
    const record = await this.vacationsService.approveLevel1(tenantId, user.sub, requestId);
    return mapRequest(record);
  }

  @Mutation(() => VacationRequestType)
  @UseGuards(RolesGuard)
  @Roles('NOMINA', 'OWNER', 'SUPER_ADMIN')
  async approveVacationLevel2(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('requestId', { type: () => ID }) requestId: string,
  ): Promise<VacationRequestType> {
    const tenantId = this.resolveTenantId(user, context);
    const record = await this.vacationsService.approveLevel2(tenantId, user.sub, requestId);
    return mapRequest(record);
  }

  @Mutation(() => VacationRequestType)
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  async rejectVacation(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: RejectVacationInputType,
  ): Promise<VacationRequestType> {
    const tenantId = this.resolveTenantId(user, context);
    const record = await this.vacationsService.reject(tenantId, user.sub, {
      requestId: input.requestId,
      rejectionReason: input.rejectionReason,
    });
    return mapRequest(record);
  }

  private resolveTenantId(user: JwtPayload, context: GqlRequestContext): string {
    if (user?.tenantId) {
      return user.tenantId;
    }
    return getTenantIdFromContext(context);
  }
}
