import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { OperationalRole } from '@prisma/client';
import type { Request } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { MesJwtGuard } from '../guards/mes-jwt.guard';
import { MesRolesGuard } from '../guards/mes-roles.guard';
import type { MesJwtPayload } from '../interfaces/mes-auth.interfaces';
import { MesAuthService } from '../service/mes-auth.service';
import {
  MesAuthResponseDto,
  MesMeResponseDto,
  MesRoleResponseDto,
  MesUserResponseDto,
} from './dto/mes-auth-response.dto';
import { MesCreateUserDto } from './dto/mes-create-user.dto';
import { MesLoginDto } from './dto/mes-login.dto';

type MesRequestUser = MesJwtPayload & { jti?: string };

@ApiTags('mes-auth')
@Controller()
export class MesAuthController {
  constructor(private readonly mesAuthService: MesAuthService) {}

  @Public()
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
  @ApiOperation({ summary: 'Login with cédula and PIN' })
  @ApiOkResponse({ type: MesAuthResponseDto, description: 'Returns access + refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Post('mes/auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: MesLoginDto, @Headers('x-tenant-id') tenantId: string, @Req() req: Request) {
    const ipAddress = this.resolveClientIp(req);
    const userAgent = req.headers['user-agent'];
    return this.mesAuthService.login(dto, ipAddress, tenantId, userAgent);
  }

  @Public()
  @UseGuards(MesJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiOkResponse({ description: 'Logged out successfully' })
  @Post('mes/auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request & { user: MesRequestUser }) {
    const ipAddress = this.resolveClientIp(req);
    const userAgent = req.headers['user-agent'];
    await this.mesAuthService.logout(req.user.sub, req.user.jti, ipAddress, userAgent);
    return { message: 'Logged out successfully.' };
  }

  @Public()
  @UseGuards(MesJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current operational user profile' })
  @ApiOkResponse({ type: MesMeResponseDto })
  @Get('mes/auth/me')
  me(@Req() req: Request & { user: MesRequestUser }) {
    return this.mesAuthService.me(req.user.sub);
  }

  @Public()
  @UseGuards(MesJwtGuard, MesRolesGuard)
  @Roles(OperationalRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get role for an operational user (OWNER only)' })
  @ApiOkResponse({ type: MesRoleResponseDto })
  @Get('mes/users/:userId/role')
  getRole(@Param('userId') userId: string, @Req() req: Request & { user: MesRequestUser }) {
    return this.mesAuthService.getRole(req.user.sub, userId);
  }

  @Public()
  @UseGuards(MesJwtGuard, MesRolesGuard)
  @Roles(OperationalRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an operational user (OWNER only)' })
  @ApiCreatedResponse({ type: MesUserResponseDto })
  @ApiConflictResponse({ description: 'Cédula already registered for this tenant' })
  @ApiForbiddenResponse({ description: 'Insufficient role or inactive requester' })
  @Post('mes/users')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() dto: MesCreateUserDto, @Req() req: Request & { user: MesRequestUser }) {
    return this.mesAuthService.createUser(req.user.sub, dto);
  }

  private resolveClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket.remoteAddress ?? '0.0.0.0';
  }
}
