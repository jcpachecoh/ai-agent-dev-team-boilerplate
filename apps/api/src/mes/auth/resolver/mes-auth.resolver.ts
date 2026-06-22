import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { IsString, Matches } from 'class-validator';
import { Public } from '../../../common/decorators/public.decorator';
import {
  getClientIpFromContext,
  getTenantIdFromContext,
  getUserAgentFromContext,
  type GqlRequestContext,
} from '../../../common/graphql/tenant-from-context';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { MesJwtGuard } from '../guards/mes-jwt.guard';
import type {
  MesAuthTokens,
  MesJwtPayload,
  MesLocationSummary,
  MesMeResponse,
} from '../interfaces/mes-auth.interfaces';
import { MesAuthService } from '../service/mes-auth.service';

@ObjectType('OperationalLocationSummary')
class OperationalLocationSummaryType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  code?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;
}

@ObjectType('OperationalUser')
class OperationalUserType {
  @Field(() => ID)
  id!: string;

  @Field()
  role!: string;

  @Field()
  tenantId!: string;

  @Field(() => String, { nullable: true })
  locationId?: string | null;
}

@ObjectType('OperationalAuthTokens')
class OperationalAuthTokensType {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => OperationalUserType)
  operator!: OperationalUserType;

  @Field(() => [OperationalLocationSummaryType])
  locations!: MesLocationSummary[];

  @Field()
  requiresLocationSelection!: boolean;
}

@ObjectType('MessagePayload')
class MessagePayloadType {
  @Field()
  message!: string;
}

@InputType('OperationalLoginInput')
class OperationalLoginInput {
  @Field()
  @IsString()
  @Matches(/^\d{8,11}$/, { message: 'cedula must be 8–11 numeric digits' })
  cedula!: string;

  @Field()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4–6 numeric digits' })
  pin!: string;
}

@InputType('OperationalSelectLocationInput')
class OperationalSelectLocationInput {
  @Field()
  @IsString()
  locationId!: string;
}

@Resolver()
export class MesAuthResolver {
  constructor(private readonly mesAuthService: MesAuthService) {}

  @Public()
  @Mutation(() => OperationalAuthTokensType)
  loginOperational(
    @Context() context: GqlRequestContext,
    @Args('input') input: OperationalLoginInput,
  ): Promise<MesAuthTokens> {
    return this.mesAuthService.login(
      input,
      getClientIpFromContext(context),
      getTenantIdFromContext(context),
      getUserAgentFromContext(context),
    );
  }

  @Public()
  @UseGuards(MesJwtGuard)
  @Mutation(() => MessagePayloadType)
  async logoutOperational(
    @Context() context: GqlRequestContext,
    @CurrentUser() user: MesJwtPayload,
  ): Promise<{ message: string }> {
    await this.mesAuthService.logout(
      user.sub,
      user.jti,
      getClientIpFromContext(context),
      getUserAgentFromContext(context),
    );
    return { message: 'Logged out successfully.' };
  }

  @Public()
  @UseGuards(MesJwtGuard)
  @Query(() => [OperationalLocationSummaryType], { name: 'myOperationalLocations' })
  myOperationalLocations(@CurrentUser() user: MesJwtPayload): Promise<MesLocationSummary[]> {
    return this.mesAuthService.myLocations(user.sub);
  }

  @Public()
  @UseGuards(MesJwtGuard)
  @Mutation(() => OperationalAuthTokensType, { name: 'selectOperationalLocation' })
  selectOperationalLocation(
    @CurrentUser() user: MesJwtPayload,
    @Args('input') input: OperationalSelectLocationInput,
  ): Promise<MesAuthTokens> {
    return this.mesAuthService.selectLocation(user.sub, input.locationId);
  }

  @Public()
  @UseGuards(MesJwtGuard)
  @Query(() => OperationalUserType)
  meOperational(@CurrentUser() user: MesJwtPayload): Promise<MesMeResponse> {
    return this.mesAuthService.me(user.sub, user.locationId);
  }
}
