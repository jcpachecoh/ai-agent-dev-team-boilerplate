import { Resolver, Query, Mutation, Args, ObjectType, Field, InputType, ID } from '@nestjs/graphql';
import { OperationalUser } from '@prisma/client';
import { UserService } from '../service/user.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';

@ObjectType('User')
export class UserType {
  @Field(() => ID) id!: string;
  @Field() role!: string;
  @Field() tenantId!: string;
  @Field(() => String, { nullable: true }) sedeId?: string | null;
  @Field() isActive!: boolean;
  @Field(() => Date, { nullable: true }) lastLoginAt?: Date | null;
  @Field() createdAt!: Date;
}

@InputType()
export class UpdateProfileInputDto {
  @Field(() => String, { nullable: true }) sedeId?: string;
}

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserType, { nullable: true })
  async me(@CurrentUser() currentUser: JwtPayload): Promise<OperationalUser | null> {
    return this.userService.getMe(currentUser.sub);
  }

  @Mutation(() => UserType)
  async updateProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: UpdateProfileInputDto,
  ): Promise<OperationalUser> {
    return this.userService.updateProfile(currentUser.sub, input);
  }
}
