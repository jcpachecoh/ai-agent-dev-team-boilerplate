# MES-AUTH-01 Task 06 — `MesAuthController`

## Goal

Implement `MesAuthController` with the 4 required MES auth endpoints.
The controller injects only `MesAuthService` — no repository injection.

**Depends on:** Task 04 (service), Task 05 (DTOs), Task 07 (guard — import only, not registered yet).

---

## Scope

- Create `apps/api/src/mes/auth/controller/mes-auth.controller.ts`.

---

## Out of scope

- No service or repository changes.
- No module wiring (Task 08).
- No integration tests at this step.

---

## Files allowed

- `apps/api/src/mes/auth/controller/mes-auth.controller.ts` — create

---

## Files forbidden

- Any file in `apps/api/src/auth/`
- `mes-auth.module.ts` — not yet
- `schema.prisma`

---

## Implementation notes

```typescript
// apps/api/src/mes/auth/controller/mes-auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { MesAuthService } from '../service/mes-auth.service';
import { MesLoginDto } from './dto/mes-login.dto';
import { MesJwtGuard } from '../guards/mes-jwt.guard';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('mes-auth')
@Controller('mes/auth')
export class MesAuthController {
  constructor(private readonly mesAuthService: MesAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with cédula and PIN' })
  @ApiOkResponse({ description: 'Returns access + refresh tokens' })
  login(@Body() dto: MesLoginDto, @Req() req: Request) {
    const ip = req.ip ?? 'unknown';
    return this.mesAuthService.login(dto, ip);
  }

  @UseGuards(MesJwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiOkResponse({ description: 'Logged out' })
  logout(@Req() req: Request & { user: { sub: string } }) {
    return this.mesAuthService.logout(req.user.sub);
  }

  @UseGuards(MesJwtGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current operational user info' })
  me(@Req() req: Request & { user: { sub: string } }) {
    return this.mesAuthService.me(req.user.sub);
  }
}
```

```typescript
// apps/api/src/mes/users/controller/mes-users.controller.ts
// Note: GET /mes/users/:userId/role may live in a separate controller under mes/users/
// OR be added as a route in MesAuthController. Preferred: keep it in MesAuthController
// to avoid creating a whole new module for a single read endpoint.

  @UseGuards(MesJwtGuard)
  @Get('/users/:userId/role')   // maps to GET /mes/auth/users/:userId/role
  // OR register the controller at Controller('mes') and put all routes together
```

**Routing decision:** Register `MesAuthController` at `@Controller('mes')` and use full
sub-paths `auth/login`, `auth/logout`, `auth/me`, `users/:userId/role` — this avoids a
second controller while keeping routes under `/mes/`.

Final route map:

- `POST /mes/auth/login`
- `POST /mes/auth/logout`
- `GET /mes/auth/me`
- `GET /mes/users/:userId/role` — registered via `@Get('users/:userId/role')` on `@Controller('mes')`

**Note:** The actual routing prefix must be confirmed when writing the controller to ensure
`@Controller('mes')` + `@Get('users/:userId/role')` produces `/mes/users/:userId/role`.
If `@Controller('mes/auth')` is used, add a separate controller `@Controller('mes/users')`
in the same module for the role endpoint.

---

## Acceptance criteria

- [ ] `POST /mes/auth/login` calls `mesAuthService.login(dto, ip)` and returns tokens.
- [ ] `POST /mes/auth/logout` is guarded by `MesJwtGuard`, calls `mesAuthService.logout(sub)`.
- [ ] `GET /mes/auth/me` is guarded by `MesJwtGuard`, calls `mesAuthService.me(sub)`.
- [ ] `GET /mes/users/:userId/role` is guarded by `MesJwtGuard`, calls `mesAuthService.getRole(userId)`.
- [ ] Controller does not inject `MesAuthRepository`.
- [ ] Controller does not contain business logic.
- [ ] `tenantId` is not accepted from request body.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
