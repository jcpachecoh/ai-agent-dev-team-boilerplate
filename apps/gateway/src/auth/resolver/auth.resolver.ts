import { Resolver, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { OperationalUser } from '@prisma/client';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthService } from '../service/auth.service';
import type { JwtPayload } from '../interfaces/auth.interfaces';

@ObjectType()
export class AuthUserResponse {
  @Field() id!: string;
  @Field() role!: string;
  @Field() tenantId!: string;
  @Field(() => String, { nullable: true }) sedeId?: string;
  @Field() isActive!: boolean;
}

@ObjectType()
export class AuthResponse {
  @Field() token!: string;
  @Field(() => AuthUserResponse) user!: OperationalUser;
}

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  async login(
    @Args('cedula') cedula: string,
    @Args('pin') pin: string,
    @Args('tenantId') tenantId: string,
  ): Promise<{ token: string; user: OperationalUser }> {
    return this.authService.loginWithPin(cedula, pin, tenantId);
  }

  @Mutation(() => Boolean)
  async logout(): Promise<boolean> {
    return true;
  }

  @Mutation(() => AuthResponse)
  async refreshToken(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<{ token: string; user: OperationalUser }> {
    const user = await this.authService.getUserById(currentUser.sub);
    const token = this.authService.signToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      sedeId: user.sedeId ?? undefined,
    });
    return { token, user };
  }
}
