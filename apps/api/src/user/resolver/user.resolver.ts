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
import { OperationalUser } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { UserService } from '../service/user.service';

@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id!: string;

  @Field()
  role!: string;

  @Field()
  tenantId!: string;

  @Field(() => String, { nullable: true })
  sedeId?: string | null;

  @Field()
  isActive!: boolean;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;

  @Field()
  createdAt!: Date;
}

@InputType()
export class UpdateProfileInputDto {
  @Field(() => String, { nullable: true })
  sedeId?: string | null;
}

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  /** OperationalUser profile — not global auth `me` (see AuthResolver.me → AuthUserProfile). */
  @Query(() => UserType, { nullable: true, name: 'operationalProfile' })
  operationalProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Context() context: GqlRequestContext,
  ): Promise<OperationalUser | null> {
    return this.userService.getOperationalProfile(currentUser.sub, getTenantIdFromContext(context));
  }

  @Mutation(() => UserType)
  updateProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: UpdateProfileInputDto,
  ): Promise<OperationalUser> {
    return this.userService.updateProfile(currentUser.sub, input);
  }
}
