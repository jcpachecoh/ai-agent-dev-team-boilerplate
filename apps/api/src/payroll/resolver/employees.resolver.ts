import {
  Args,
  Context,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  PartialType,
  Query,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import { ArlRiskLevel, DocumentType, EmployeeContractType, SalaryType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDate,
} from 'class-validator';
import { PayrollService } from '../service/payroll.service';
import { getTenantIdFromContext } from '../../common/graphql/tenant-from-context';
import { toEmployeeResponse } from '../mapper/employees.mapper';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Register Enums
registerEnumType(EmployeeContractType, { name: 'EmployeeContractType' });
registerEnumType(SalaryType, { name: 'SalaryType' });
registerEnumType(ArlRiskLevel, { name: 'ArlRiskLevel' });
registerEnumType(DocumentType, { name: 'DocumentType' });

@ObjectType('EmployeeUser')
export class EmployeeUserType {
  @Field() email!: string;
  @Field() cedula!: string;
  @Field(() => DocumentType) documentType!: DocumentType;
}

@ObjectType('EmployeeDetails')
export class EmployeeDetailsType {
  @Field(() => ID) id!: string;
  @Field(() => ID) userId!: string;
  @Field() tenantId!: string;
  @Field() name!: string;
  @Field() locationId!: string;
  @Field() position!: string;
  @Field() area!: string;
  @Field() department!: string;
  @Field(() => EmployeeContractType) contractType!: EmployeeContractType;
  @Field() hireDate!: Date;
  @Field() contractStart!: Date;
  @Field(() => Date, { nullable: true }) contractEnd?: Date | null;
  @Field(() => SalaryType) salaryType!: SalaryType;
  @Field() salaryAmount!: string;
  @Field() hasTransportSubsidy!: boolean;
  @Field() isExemptFromTax!: boolean;
  @Field() epsName!: string;
  @Field() pensionFundName!: string;
  @Field() cesantiasFundName!: string;
  @Field() arlName!: string;
  @Field(() => ArlRiskLevel) arlRiskLevel!: ArlRiskLevel;
  @Field() cajaCompensacion!: string;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  @Field(() => Date, { nullable: true }) deletedAt?: Date | null;
  @Field(() => EmployeeUserType, { nullable: true }) user?: EmployeeUserType;
}

@ObjectType('EmployeePaginatedResult')
export class EmployeePaginatedResultType {
  @Field(() => [EmployeeDetailsType])
  items!: EmployeeDetailsType[];

  @Field(() => Int)
  total!: number;
}

@InputType()
export class CreateEmployeeInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  cedula!: string;

  @Field(() => DocumentType)
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  roleId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  position!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  area!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  department!: string;

  @Field(() => EmployeeContractType)
  @IsEnum(EmployeeContractType)
  @IsNotEmpty()
  contractType!: EmployeeContractType;

  @Field()
  @IsDate()
  @IsNotEmpty()
  hireDate!: Date;

  @Field()
  @IsDate()
  @IsNotEmpty()
  contractStart!: Date;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  contractEnd?: Date;

  @Field(() => SalaryType)
  @IsEnum(SalaryType)
  @IsNotEmpty()
  salaryType!: SalaryType;

  @Field()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  salaryAmount!: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  epsName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  pensionFundName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  cesantiasFundName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  arlName!: string;

  @Field(() => ArlRiskLevel)
  @IsEnum(ArlRiskLevel)
  @IsNotEmpty()
  arlRiskLevel!: ArlRiskLevel;

  @Field()
  @IsString()
  @IsNotEmpty()
  cajaCompensacion!: string;
}

@InputType()
export class UpdateEmployeeInput extends PartialType(CreateEmployeeInput) {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  isActive?: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Resolver(() => EmployeeDetailsType)
export class EmployeesResolver {
  constructor(private readonly employeesService: PayrollService) {}

  @Query(() => EmployeePaginatedResultType)
  async employees(
    @CurrentUser() user: any,
    @Context() context: any,
    @Args('locationId', { type: () => ID, nullable: true }) locationId?: string,
    @Args('contractType', { type: () => EmployeeContractType, nullable: true })
    contractType?: EmployeeContractType,
    @Args('includeInactive', { type: () => Boolean, nullable: true }) includeInactive?: boolean,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<EmployeePaginatedResultType> {
    const tenantId = this.resolveTenantId(user, context);
    const employees = await this.employeesService.findAll(tenantId, {
      locationId,
      contractType,
      includeInactive,
      limit,
      offset,
    });

    // In a real scenario, we might need a separate count method in the service
    // For now, returning the items.
    return {
      items: employees.map((e) => toEmployeeResponse(e) as any),
      total: employees.length, // This is a simplification
    };
  }

  @Query(() => EmployeeDetailsType, { nullable: true })
  async employee(
    @CurrentUser() user: any,
    @Context() context: any,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<EmployeeDetailsType> {
    const tenantId = this.resolveTenantId(user, context);
    const employee = await this.employeesService.findOne(tenantId, userId);
    return toEmployeeResponse(employee) as any;
  }

  @Mutation(() => EmployeeDetailsType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async createEmployee(
    @CurrentUser() user: any,
    @Context() context: any,
    @Args('input') input: CreateEmployeeInput,
  ): Promise<EmployeeDetailsType> {
    const tenantId = this.resolveTenantId(user, context);
    const employee = await this.employeesService.create(tenantId, input);
    return toEmployeeResponse(employee) as any;
  }

  @Mutation(() => EmployeeDetailsType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async updateEmployee(
    @CurrentUser() user: any,
    @Context() context: any,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('input') input: UpdateEmployeeInput,
  ): Promise<EmployeeDetailsType> {
    const tenantId = this.resolveTenantId(user, context);
    const employee = await this.employeesService.update(tenantId, userId, input);
    return toEmployeeResponse(employee) as any;
  }

  @Mutation(() => Boolean)
  @Roles(...PAYROLL_WRITE_ROLES)
  async deactivateEmployee(
    @CurrentUser() user: any,
    @Context() context: any,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    const tenantId = this.resolveTenantId(user, context);
    await this.employeesService.remove(tenantId, userId);
    return true;
  }

  private resolveTenantId(user: any, context: any): string {
    if (user?.tenantId) {
      return user.tenantId;
    }
    return getTenantIdFromContext(context);
  }
}
