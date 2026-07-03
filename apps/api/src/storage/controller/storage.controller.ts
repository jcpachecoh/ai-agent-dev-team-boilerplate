import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorageService } from '../service/storage.service';
import { PresignedUrlResponseDto } from './dto/presigned-url.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadResultDto } from './dto/upload-result.dto';
import { FileValidationPipe } from '../pipes/file-validation.pipe';
import type { ValidatedFile } from '../pipes/file-validation.pipe';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const DEFAULT_PRESIGNED_TTL_SECONDS = 900;

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Sube un archivo al storage centralizado' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(FileValidationPipe) file: ValidatedFile,
    @Body() dto: UploadFileDto,
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const result = await this.storageService.uploadFile({
      tenantId: user.tenantId,
      uploadedBy: user.sub,
      domain: dto.domain,
      imageProfile: dto.imageProfile,
      entityType: dto.entityType,
      entityId: dto.entityId,
      visibility: dto.visibility,
      file,
    });

    return UploadResultDto.from(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un archivo (soft delete + borrado en proveedor)' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.storageService.deleteFile(id, user.tenantId);
  }

  @Get(':id/presigned')
  @ApiOperation({ summary: 'Genera una URL firmada para assets privados' })
  async presigned(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('ttl') ttl?: string,
  ): Promise<PresignedUrlResponseDto> {
    const ttlSeconds = ttl ? Math.min(parseInt(ttl, 10), 86400) : DEFAULT_PRESIGNED_TTL_SECONDS;
    const url = await this.storageService.getPresignedUrl(id, user.tenantId, ttlSeconds);
    return { url, expiresInSeconds: ttlSeconds };
  }
}
