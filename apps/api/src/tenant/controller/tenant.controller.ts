import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { TenantService } from '../service/tenant.service';
import type { UploadedLogoFileDto, UploadTenantLogoResponseDto } from './dto';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_LOGO_BYTES },
    }),
  )
  async uploadLogo(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: UploadedLogoFileDto,
  ): Promise<UploadTenantLogoResponseDto> {
    if (!file) {
      throw new BadRequestException('Archivo de logo requerido');
    }

    const tenant = await this.tenantService.uploadLogo(user.tenantId, {
      mimetype: file.mimetype,
      buffer: file.buffer,
    });

    return { logoUrl: tenant.logoUrl ?? `/api/tenant/logo/${tenant.id}` };
  }

  @Public()
  @Get('logo/:tenantId')
  async serveLogo(@Param('tenantId') tenantId: string, @Res() res: Response): Promise<void> {
    const filePath = await this.tenantService.resolveLogoFilePath(tenantId);
    if (!filePath) {
      throw new NotFoundException('Logo no encontrado');
    }

    res.sendFile(filePath);
  }
}
