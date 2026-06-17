# RES-226 Task 09 — AuthController: Four New Endpoints

## Goal

Add four new `@Public()` endpoints to `AuthController` and their corresponding DTOs:

- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`

Also inject `AuthEmailService` into `AuthController` and update the existing controller test.

**Depends on:** Task 06 (sendResetPassword), Task 07 (sendVerifyEmail + verifyOtp), Task 08
(sendWelcome + sendInvitation).

---

## Scope

- Add 4 new endpoints to `apps/api/src/auth/controller/auth.controller.ts`.
- Create 4 new DTOs in `apps/api/src/auth/controller/dto/`.
- Update `apps/api/src/auth/test/auth.controller.spec.ts`.

---

## Out of scope

- No module wiring (Task 10).
- No `AuthEmailService` implementation changes.
- No new repository logic.

---

## Files allowed

- `apps/api/src/auth/controller/auth.controller.ts` — add endpoints and inject `AuthEmailService`
- `apps/api/src/auth/controller/dto/forgot-password.dto.ts` — create
- `apps/api/src/auth/controller/dto/reset-password.dto.ts` — create
- `apps/api/src/auth/controller/dto/verify-email.dto.ts` — create
- `apps/api/src/auth/controller/dto/resend-verification.dto.ts` — create
- `apps/api/src/auth/test/auth.controller.spec.ts` — update

---

## Files forbidden

- `auth.module.ts` (wiring is Task 10)
- Any file in `packages/`
- `schema.prisma`
- Any service or repository file

---

## Implementation notes

### DTOs

```typescript
// forgot-password.dto.ts
export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

// reset-password.dto.ts
export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

// verify-email.dto.ts
export class VerifyEmailDto {
  @ApiProperty({ example: '847291' })
  @IsString()
  @Length(6, 6)
  otpCode!: string;
}

// resend-verification.dto.ts
export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}
```

### Controller endpoints

```typescript
// Inject both services
constructor(
  private readonly authService: AuthService,
  private readonly authEmailService: AuthEmailService,
) {}

@Public()
@Post('forgot-password')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Request a password reset email' })
@ApiOkResponse({ description: 'Always returns 200 to prevent email enumeration' })
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  await this.authEmailService.sendResetPassword(dto.email, {
    tenantId: 'global',
    tenantName: 'RestOpsIQ',
  });
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

@Post('verify-email')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Verify email address using OTP code' })
@ApiBearerAuth()
async verifyEmail(
  @Body() dto: VerifyEmailDto,
  @Req() req: Request & { user: { sub: string } },
) {
  await this.authEmailService.verifyOtp(req.user.sub, dto.otpCode);
  return { message: 'Email verified successfully.' };
}

@Public()
@Post('resend-verification')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Resend email verification code' })
async resendVerification(@Body() dto: ResendVerificationDto) {
  const user = await this.authService.findByEmail(dto.email);
  if (user) {
    await this.authEmailService.sendVerifyEmail(
      { id: user.id, email: user.email, name: user.name ?? user.email },
      { tenantId: 'global', tenantName: 'RestOpsIQ' },
    );
  }
  return { message: 'If the email exists, a verification code has been sent.' };
}
```

Note: `POST /verify-email` requires JWT (no `@Public()`) — the user must be authenticated to
identify which `userId` to use for the OTP lookup. `AuthService` needs a `findByEmail()` public
method for `resend-verification` (this may already exist via the repository — expose it).

### tenantId placeholder

Until a real `Tenant` model exists, use `tenantId: 'global'` and `tenantName: 'RestOpsIQ'` as
defaults. These values will be replaced when tenant context is available in the request.

### Controller test updates

The `AuthController` test must be updated:

- Add `authEmailServiceMock` to the module providers.
- Add tests for each new endpoint (delegation, always-200 responses).
- Update existing constructor binding expectations.

Minimum new tests:

- `forgotPassword` returns 200 `{ message: ... }` and delegates to `authEmailService.sendResetPassword`.
- `resetPassword` delegates to `authService.resetPassword`.
- `resetPassword` propagates `BadRequestException` from service.
- `verifyEmail` delegates to `authEmailService.verifyOtp` with `req.user.sub`.
- `resendVerification` returns 200 always (even when `authService.findByEmail` returns null).

---

## Acceptance criteria

- [ ] 4 new DTOs created with proper `class-validator` decorators.
- [ ] 4 new endpoints added to `AuthController`.
- [ ] `POST /forgot-password`, `POST /reset-password`, `POST /resend-verification` are `@Public()`.
- [ ] `POST /verify-email` is NOT `@Public()` (requires JWT).
- [ ] Controller test updated — all new endpoint tests pass.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=auth.controller` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth.controller
```
