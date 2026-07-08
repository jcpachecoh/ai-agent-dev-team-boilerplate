import {
  Args,
  Context,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
} from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import type { KioskAuthInput, KioskAuthResult } from '../interfaces/attendance.interfaces';
import { AttendanceService } from '../service/attendance.service';

@InputType('KioskAuthInput')
class KioskAuthInputType implements KioskAuthInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8,11}$/, { message: 'Credenciales inválidas' })
  cedula!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'Credenciales inválidas' })
  pin!: string;
}

@ObjectType('KioskAuthResult')
class KioskAuthResultType implements KioskAuthResult {
  @Field(() => ID)
  userId!: string;

  @Field()
  fullName!: string;

  @Field(() => ID)
  locationId!: string;

  @Field(() => ID)
  employeeId!: string;

  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;
}

@Resolver()
export class AttendanceResolver {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Public()
  @Mutation(() => KioskAuthResultType, {
    description: 'Autenticación kiosko: cédula + PIN → userId y JWT de sesión',
  })
  kioskAuth(
    @Context() context: GqlRequestContext,
    @Args('input') input: KioskAuthInputType,
  ): Promise<KioskAuthResult> {
    return this.attendanceService.kioskAuth(input, getTenantIdFromContext(context));
  }
}
