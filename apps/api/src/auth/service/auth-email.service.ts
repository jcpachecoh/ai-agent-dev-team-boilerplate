import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { EmailService } from '@restopsiq/email';
import type { WelcomeProps } from '@restopsiq/email';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import type { IAuthEmailService, TenantContext } from '../interfaces/auth.interfaces';

const RESET_TOKEN_TTL_SECONDS = 3600;
const OTP_TTL_SECONDS = 900;
const OTP_EXPIRES_IN_MINUTES = 15;
const INVITE_TOKEN_TTL_SECONDS = 172_800; // 48 hours
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

@Injectable()
export class AuthEmailService implements IAuthEmailService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthEmailService.name);
  private redis!: Redis;

  constructor(
    private readonly emailService: EmailService,
    private readonly authRepository: AuthRepository,
    private readonly authEmailRepository: AuthEmailRepository,
  ) {}

  onModuleInit(): void {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.logger.log(`Redis connected for auth-email at ${redisUrl}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  // ---------------------------------------------------------------------------
  // Reset password
  // ---------------------------------------------------------------------------

  async sendResetPassword(
    userEmail: string,
    tenant: TenantContext,
    ipAddress?: string,
  ): Promise<void> {
    this.logger.log(
      `[reset-password] Request received for email="${userEmail}" tenant="${tenant.tenantId}"`,
    );

    const user = await this.authRepository.findByTenantAndEmail(tenant.tenantId, userEmail);
    if (!user) {
      this.logger.log(
        `[reset-password] User not found for email="${userEmail}" — silently skipping (anti-enumeration)`,
      );
      return;
    }

    await this.authEmailRepository.deleteExpiredResetTokens(user.id);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_SECONDS * 1000);

    await this.authEmailRepository.createResetToken({
      tenantId: tenant.tenantId,
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    this.logger.log(
      `[reset-password] Token created for userId="${user.id}" expiresAt="${expiresAt.toISOString()}"`,
    );

    const resetUrl = `${APP_URL}/auth/reset-password?token=${rawToken}`;
    const expiresAtFormatted = expiresAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    const { jobId } = await this.emailService.send({
      to: userEmail,
      subject: 'Restablece tu contraseña',
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantLogoUrl: tenant.tenantLogoUrl,
      primaryColor: tenant.primaryColor,
      template: {
        type: 'reset-password',
        props: {
          userName: user.email,
          resetUrl,
          expiresAt: expiresAtFormatted,
          ipAddress,
        },
      },
      priority: 'urgent',
    });

    this.logger.log(
      `[reset-password] Email job enqueued — jobId="${jobId}" to="${userEmail}" resetUrl="${resetUrl}"`,
    );
  }

  // ---------------------------------------------------------------------------
  // Verify email (OTP via Redis)
  // ---------------------------------------------------------------------------

  async sendVerifyEmail(
    user: { id: string; email: string },
    tenant: TenantContext,
  ): Promise<{ otpCode: string }> {
    this.logger.log(
      `[verify-email] Request received for userId="${user.id}" email="${user.email}"`,
    );

    const otpCode = String(crypto.randomInt(100_000, 999_999));
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const redisValue = JSON.stringify({ userId: user.id, email: user.email });
    await this.redis.set(`otp:${otpHash}`, redisValue, 'EX', OTP_TTL_SECONDS);

    this.logger.log(
      `[verify-email] OTP stored in Redis for userId="${user.id}" TTL=${OTP_TTL_SECONDS}s`,
    );

    const { jobId } = await this.emailService.send({
      to: user.email,
      subject: 'Verifica tu correo electrónico',
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantLogoUrl: tenant.tenantLogoUrl,
      primaryColor: tenant.primaryColor,
      template: {
        type: 'verify-email',
        props: {
          userName: user.email,
          otpCode,
          expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
        },
      },
      priority: 'urgent',
    });

    this.logger.log(`[verify-email] Email job enqueued — jobId="${jobId}" to="${user.email}"`);

    return { otpCode };
  }

  async verifyOtp(otpCode: string): Promise<void> {
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const stored = await this.redis.get(`otp:${otpHash}`);
    if (!stored) {
      this.logger.warn(
        `[verify-email] OTP not found or expired — hash="${otpHash.slice(0, 8)}..."`,
      );
      throw new BadRequestException('Invalid or expired verification code');
    }
    await this.redis.del(`otp:${otpHash}`);
    const { userId } = JSON.parse(stored) as { userId: string; email: string };
    this.logger.log(`[verify-email] OTP verified and consumed for userId="${userId}"`);
  }

  // ---------------------------------------------------------------------------
  // Welcome
  // ---------------------------------------------------------------------------

  async sendWelcome(
    user: { email: string; name: string; role: string },
    tenant: TenantContext,
    temporaryPassword?: string,
  ): Promise<void> {
    const loginUrl = `${APP_URL}/login`;

    const { jobId } = await this.emailService.send({
      to: user.email,
      subject: `Bienvenido a ${tenant.tenantName}`,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantLogoUrl: tenant.tenantLogoUrl,
      primaryColor: tenant.primaryColor,
      template: {
        type: 'welcome',
        props: {
          userName: user.name,
          role: user.role as WelcomeProps['role'],
          loginUrl,
          temporaryPassword,
        },
      },
    });

    this.logger.log(`[welcome] Email job enqueued — jobId="${jobId}" to="${user.email}"`);
  }

  // ---------------------------------------------------------------------------
  // Invitation
  // ---------------------------------------------------------------------------

  async sendInvitation(
    invitee: { email: string; name: string },
    inviter: { name: string },
    tenant: TenantContext,
    role: string,
    workspaceName: string,
  ): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    await this.redis.set(`invite:${rawToken}`, invitee.email, 'EX', INVITE_TOKEN_TTL_SECONDS);

    const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_SECONDS * 1000);
    const expiresAtFormatted = expiresAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    const acceptUrl = `${APP_URL}/auth/accept-invite?token=${rawToken}`;

    const { jobId } = await this.emailService.send({
      to: invitee.email,
      subject: `Invitación a ${workspaceName}`,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantLogoUrl: tenant.tenantLogoUrl,
      primaryColor: tenant.primaryColor,
      template: {
        type: 'invite-user',
        props: {
          inviteeName: invitee.name,
          inviterName: inviter.name,
          role,
          workspaceName,
          acceptUrl,
          expiresAt: expiresAtFormatted,
        },
      },
    });

    this.logger.log(
      `[invitation] Email job enqueued — jobId="${jobId}" to="${invitee.email}" workspace="${workspaceName}"`,
    );
  }
}
