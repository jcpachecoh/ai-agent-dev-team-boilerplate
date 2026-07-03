import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../service/auth.service';
import { AuthEmailService } from '../service/auth-email.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import type { JwtPayload, TenantContext } from '../interfaces/auth.interfaces';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authEmailService: AuthEmailService,
  ) {}

  @Public()
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'Returns access + refresh tokens' })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto, @Headers('x-tenant-id') tenantId: string) {
    return this.authService.signup(this.requireTenantId(tenantId), dto);
  }

  @Public()
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Returns access + refresh tokens' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Headers('x-tenant-id') tenantId: string, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(
      this.requireTenantId(tenantId),
      dto,
      Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
    );
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Rotate refresh token and get new access token' })
  @ApiOkResponse({ description: 'Returns new access + refresh tokens' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: Request & { user: JwtPayload & { refreshToken: string } }) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.refresh(
      req.user.sub,
      req.user.refreshToken,
      Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
      req.user.locationId ?? null,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active locations assigned to the authenticated user' })
  @Get('my-locations')
  myLocations(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.myLocations(req.user.tenantId, req.user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select active location and rotate session tokens' })
  @Post('select-location')
  @HttpCode(HttpStatus.OK)
  selectLocation(@Body() body: { locationId: string }, @Req() req: Request & { user: JwtPayload }) {
    return this.authService.selectLocation(req.user.tenantId, req.user.sub, body.locationId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiOkResponse({ description: 'Logged out' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request & { user: { sub: string } }) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.logout(
      req.user.sub,
      Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated global User profile' })
  @ApiOkResponse({ type: MeResponseDto })
  @Get('me')
  me(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.me(req.user.sub, req.user.locationId ?? null);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for the authenticated global User' })
  @ApiOkResponse({ description: 'Password updated successfully' })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request & { user: JwtPayload }) {
    return this.authService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }

  @Public()
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiOkResponse({ description: 'Always returns 200 to prevent email enumeration' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Headers('x-tenant-id') tenantId: string) {
    await this.authEmailService.sendResetPassword(
      dto.email,
      this.buildTenantContext(this.requireTenantId(tenantId)),
    );
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated successfully.' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address using OTP code' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authEmailService.verifyOtp(dto.otpCode);
    return { message: 'Email verified successfully.' };
  }

  @Public()
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code' })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    const resolvedTenantId = this.requireTenantId(tenantId);
    const user = await this.authService.findByTenantAndEmail(resolvedTenantId, dto.email);
    if (user) {
      await this.authEmailService.sendVerifyEmail(
        { id: user.id, email: user.email },
        this.buildTenantContext(resolvedTenantId),
      );
    }
    return { message: 'If the email exists, a verification code has been sent.' };
  }

  private requireTenantId(tenantId: string | undefined): string {
    const trimmed = tenantId?.trim();
    if (!trimmed) {
      throw new BadRequestException('x-tenant-id header is required');
    }
    return trimmed;
  }

  private buildTenantContext(tenantId: string): TenantContext {
    return {
      tenantId,
      tenantName: tenantId,
    };
  }
}
