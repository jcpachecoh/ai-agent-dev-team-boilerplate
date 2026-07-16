import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { PilaExportFormat } from '@prisma/client';
import { Response } from 'express';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PilaExportService } from '../../payroll/pila/pila-export.service';
import {
  GeneratePilaExportDto,
  MarkPilaExportPaidDto,
  PilaDeadlineResponseDto,
  PilaExportResponseDto,
  PilaListQueryDto,
  PilaValidationResponseDto,
  VoidPilaExportDto,
} from './dto/pila-export.dto';

@ApiTags('reports-pila')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Fallback tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('reports/pila')
export class PilaReportsController {
  constructor(private readonly pilaExportService: PilaExportService) {}

  @ApiOperation({ summary: 'List PILA export versions/metadata (no snapshot, no file bytes)' })
  @ApiOkResponse({ type: [PilaExportResponseDto] })
  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: PilaListQueryDto,
  ): Promise<PilaExportResponseDto[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.pilaExportService.list(tenantId, {
      period: query.period,
      status: query.status,
      format: query.format,
    }) as Promise<PilaExportResponseDto[]>;
  }

  @ApiOperation({ summary: 'Download exact stored PILA file bytes (TXT or XLSX from Storage)' })
  @ApiProduces(
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
  )
  @Get('exports/:id/download')
  async download(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const file = await this.pilaExportService.download(tenantId, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('X-Content-Checksum-SHA256', file.checksum);
    res.send(file.bytes);
  }

  @ApiOperation({
    summary:
      'Download Anexo Técnico 2 as readable review Excel (from TXT snapshot; not Aportes en Línea)',
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Get('exports/:id/download-anexo2-review')
  async downloadAnexo2Review(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const file = await this.pilaExportService.downloadAnexo2ReviewXlsx(tenantId, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('X-Content-Checksum-SHA256', file.checksum);
    res.send(file.bytes);
  }

  @ApiOperation({ summary: 'Mark PILA export as PAID (manual confirmation)' })
  @ApiOkResponse({ type: PilaExportResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Patch('exports/:id/paid')
  async markPaid(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: MarkPilaExportPaidDto,
  ): Promise<PilaExportResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.pilaExportService.markPaid(
      tenantId,
      id,
      user.sub,
      body,
    ) as Promise<PilaExportResponseDto>;
  }

  @ApiOperation({ summary: 'Void a GENERATED or PAID PILA export' })
  @ApiOkResponse({ type: PilaExportResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Patch('exports/:id/void')
  async voidExport(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: VoidPilaExportDto,
  ): Promise<PilaExportResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.pilaExportService.voidExport(
      tenantId,
      id,
      user.sub,
      body.reason,
    ) as Promise<PilaExportResponseDto>;
  }

  @ApiOperation({ summary: 'Validate PILA preparation without generating a file' })
  @ApiOkResponse({ type: PilaValidationResponseDto })
  @Get(':period/validation')
  async validate(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('period') period: string,
  ): Promise<PilaValidationResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const result = await this.pilaExportService.validatePreparation(tenantId, period, user.sub);
    return {
      ok: result.ok,
      errors: result.errors,
      summary: result.summary,
    };
  }

  @ApiOperation({
    summary: 'PILA payment deadline status (on-demand; no persistence; no scheduler)',
  })
  @ApiOkResponse({ type: PilaDeadlineResponseDto })
  @Get(':period/deadline')
  async deadline(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('period') period: string,
  ): Promise<PilaDeadlineResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.pilaExportService.getDeadline(tenantId, period);
  }

  @ApiOperation({ summary: 'Generate and persist a new PILA export version (TXT or XLSX)' })
  @ApiOkResponse({ type: PilaExportResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post(':period/generate')
  async generate(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('period') period: string,
    @Body() body: GeneratePilaExportDto = {},
  ): Promise<PilaExportResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.pilaExportService.generate(
      tenantId,
      period,
      user.sub,
      body?.format ?? PilaExportFormat.TXT,
    ) as Promise<PilaExportResponseDto>;
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
