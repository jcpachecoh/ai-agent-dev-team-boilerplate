import { BadRequestException, UseGuards } from '@nestjs/common';
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
  registerEnumType,
} from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';
import {
  getClientIpFromContext,
  getTenantIdFromContext,
  getUserAgentFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { GqlJwtRefreshGuard } from '../guards/gql-jwt-refresh.guard';
import { AuthEmailService } from '../service/auth-email.service';
import { AuthService } from '../service/auth.service';
import type {
  AuthTokens,
  AuthUserProfile,
  JwtPayload,
  TenantContext,
  UserLocationSummary,
} from '../interfaces/auth.interfaces';

registerEnumType(DocumentType, { name: 'DocumentType' });

@ObjectType('UserLocationSummary')
class UserLocationSummaryType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  code!: string | null;

  @Field(() => String, { nullable: true })
  city!: string | null;

  @Field(() => String, { nullable: true })
  address!: string | null;
}

@ObjectType('AuthTokens')
class AuthTokensType {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => [UserLocationSummaryType])
  locations!: UserLocationSummary[];

  @Field(() => ID, { nullable: true })
  locationId!: string | null;

  @Field()
  requiresLocationSelection!: boolean;
}

@ObjectType('AuthUserProfile')
class AuthUserProfileType {
  @Field(() => ID)
  id!: string;

  @Field()
  tenantId!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field()
  cedula!: string;

  @Field(() => DocumentType)
  documentType!: DocumentType;

  @Field()
  emailVerified!: boolean;

  @Field()
  isActive!: boolean;

  @Field()
  roleCode!: string;

  @Field()
  createdAt!: Date;
}

@ObjectType('MessageResponse')
class MessageResponseType {
  @Field()
  message!: string;
}

@InputType('SignupInput')
class SignupInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MaxLength(20)
  cedula!: string;

  @Field(() => DocumentType)
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roleCode?: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

@InputType('GlobalLoginInput')
class GlobalLoginInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  password!: string;
}

@InputType('ChangePasswordInput')
class ChangePasswordInput {
  @Field()
  @IsString()
  currentPassword!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

@InputType('ResetPasswordInput')
class ResetPasswordInput {
  @Field()
  @IsString()
  token!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

@InputType('VerifyEmailInput')
class VerifyEmailInput {
  @Field()
  @IsString()
  otpCode!: string;
}

@InputType('ForgotPasswordInput')
class ForgotPasswordInput {
  @Field()
  @IsEmail()
  email!: string;
}

@InputType('ResendVerificationInput')
class ResendVerificationInput {
  @Field()
  @IsEmail()
  email!: string;
}

@InputType('RefreshTokenInput')
class RefreshTokenInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

@InputType('SelectUserLocationInput')
class SelectUserLocationInput {
  @Field(() => ID)
  @IsString()
  locationId!: string;
}

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly authEmailService: AuthEmailService,
  ) {}

  @Public()
  @Mutation(() => AuthTokensType)
  signup(
    @Context() context: GqlRequestContext,
    @Args('input') input: SignupInput,
  ): Promise<AuthTokens> {
    return this.authService.signup(getTenantIdFromContext(context), input);
  }

  @Public()
  @Mutation(() => AuthTokensType)
  login(
    @Context() context: GqlRequestContext,
    @Args('input') input: GlobalLoginInput,
  ): Promise<AuthTokens> {
    return this.authService.login(
      getTenantIdFromContext(context),
      input,
      getClientIpFromContext(context),
      getUserAgentFromContext(context),
    );
  }

  @Public()
  @UseGuards(GqlJwtRefreshGuard)
  @Mutation(() => AuthTokensType)
  refreshToken(
    @Context() context: GqlRequestContext,
    @CurrentUser() currentUser: JwtPayload & { refreshToken: string },
  ): Promise<AuthTokens> {
    return this.authService.refresh(
      currentUser.sub,
      currentUser.refreshToken,
      getClientIpFromContext(context),
      getUserAgentFromContext(context),
      currentUser.locationId ?? null,
    );
  }

  @Mutation(() => AuthTokensType)
  selectUserLocation(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: SelectUserLocationInput,
  ): Promise<AuthTokens> {
    return this.authService.selectLocation(currentUser.tenantId, currentUser.sub, input.locationId);
  }

  @Query(() => [UserLocationSummaryType])
  myLocations(@CurrentUser() currentUser: JwtPayload): Promise<UserLocationSummary[]> {
    return this.authService.myLocations(currentUser.tenantId, currentUser.sub);
  }

  @Mutation(() => Boolean)
  async logout(
    @Context() context: GqlRequestContext,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<boolean> {
    try {
      await this.authService.logout(
        currentUser.sub,
        getClientIpFromContext(context),
        getUserAgentFromContext(context),
      );
    } catch {
      // Idempotent — client clears tokens locally even if session already ended.
    }
    return true;
  }

  @Query(() => AuthUserProfileType)
  me(@CurrentUser() currentUser: JwtPayload): Promise<AuthUserProfile> {
    return this.authService.me(currentUser.sub, currentUser.locationId ?? null);
  }

  @Mutation(() => MessageResponseType)
  changePassword(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: ChangePasswordInput,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(
      currentUser.sub,
      input.currentPassword,
      input.newPassword,
    );
  }

  @Public()
  @Mutation(() => MessageResponseType)
  async forgotPassword(
    @Context() context: GqlRequestContext,
    @Args('input') input: ForgotPasswordInput,
  ): Promise<{ message: string }> {
    await this.authEmailService.sendResetPassword(
      input.email,
      this.buildTenantContext(getTenantIdFromContext(context)),
    );
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Public()
  @Mutation(() => MessageResponseType)
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<{ message: string }> {
    await this.authService.resetPassword(input.token, input.newPassword);
    return { message: 'Password updated successfully.' };
  }

  @Public()
  @Mutation(() => MessageResponseType)
  async verifyEmail(@Args('input') input: VerifyEmailInput): Promise<{ message: string }> {
    await this.authEmailService.verifyOtp(input.otpCode);
    return { message: 'Email verified successfully.' };
  }

  @Public()
  @Mutation(() => MessageResponseType)
  async resendVerification(
    @Context() context: GqlRequestContext,
    @Args('input') input: ResendVerificationInput,
  ): Promise<{ message: string }> {
    const tenantId = getTenantIdFromContext(context);
    const user = await this.authService.findByTenantAndEmail(tenantId, input.email);
    if (user) {
      await this.authEmailService.sendVerifyEmail(
        { id: user.id, email: user.email },
        this.buildTenantContext(tenantId),
      );
    }
    return { message: 'If the email exists, a verification code has been sent.' };
  }

  private buildTenantContext(tenantId: string): TenantContext {
    return {
      tenantId,
      tenantName: tenantId,
    };
  }
}
