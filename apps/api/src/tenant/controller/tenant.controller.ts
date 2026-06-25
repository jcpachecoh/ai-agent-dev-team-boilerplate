import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Redirect,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { TenantService } from '../service/tenant.service';
import type { UploadTenantLogoResponseDto } from './dto';
import type { UploadedLogoFileDto } from './dto';
import { FileValidationPipe } from '../../storage/pipes/file-validation.pipe';
import type { ValidatedFile } from '../../storage/pipes/file-validation.pipe';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_LOGO_BYTES } }))
  async uploadLogo(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(FileValidationPipe) file: ValidatedFile,
  ): Promise<UploadTenantLogoResponseDto> {
    if (!file) {
      throw new BadRequestException('Archivo de logo requerido');
    }

    const tenant = await this.tenantService.uploadLogo(user.tenantId, user.sub, file);
    return { logoUrl: tenant.logoUrl ?? '' };
  }

  /**
   * @deprecated Este endpoint sigue existiendo por compatibilidad con logos almacenados
   * en filesystem local antes de la migración a Cloudflare R2.
   * Para nuevos logos, Tenant.logoUrl contiene la URL CDN directamente.
   */
  @Public()
  @Get('logo/:tenantId')
  async serveLogo(@Param('tenantId') tenantId: string, @Res() res: Response): Promise<void> {
    const tenant = await this.tenantService.findById(tenantId).catch(() => null);

    if (tenant?.logoUrl && tenant.logoUrl.startsWith('http')) {
      res.redirect(301, tenant.logoUrl);
      return;
    }

    const filePath = await this.resolveLocalLogoPath(tenantId);
    if (!filePath) {
      throw new NotFoundException('Logo no encontrado');
    }

    res.sendFile(filePath);
  }

  private async resolveLocalLogoPath(tenantId: string): Promise<string | null> {
    const tenantDir = path.join(process.cwd(), 'uploads', 'tenants', tenantId);
    for (const ext of ['png', 'jpg'] as const) {
      const filePath = path.join(tenantDir, `logo.${ext}`);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // try next
      }
    }
    return null;
  }
}
