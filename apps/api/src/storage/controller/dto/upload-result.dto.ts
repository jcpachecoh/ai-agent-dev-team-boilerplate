import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  StorageDomain,
  StorageObjectStatus,
  StorageProviderType,
  StorageVisibility,
} from '../../enums/storage.enums';
import type { StorageObjectResult } from '../../interfaces/storage.interfaces';

export class UploadResultDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() provider!: StorageProviderType;
  @ApiProperty() bucket!: string;
  @ApiProperty() key!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() size!: number;
  @ApiProperty() checksum!: string;
  @ApiPropertyOptional() etag?: string | null;
  @ApiProperty() originalName!: string;
  @ApiProperty() domain!: StorageDomain;
  @ApiPropertyOptional() entityType?: string | null;
  @ApiPropertyOptional() entityId?: string | null;
  @ApiProperty() uploadedBy!: string;
  @ApiProperty() visibility!: StorageVisibility;
  @ApiProperty() status!: StorageObjectStatus;
  @ApiPropertyOptional() publicUrl?: string | null;
  @ApiProperty() createdAt!: Date;

  static from(result: StorageObjectResult): UploadResultDto {
    const dto = new UploadResultDto();
    dto.id = result.id;
    dto.tenantId = result.tenantId;
    dto.provider = result.provider;
    dto.bucket = result.bucket;
    dto.key = result.key;
    dto.mimeType = result.mimeType;
    dto.size = result.size;
    dto.checksum = result.checksum;
    dto.etag = result.etag;
    dto.originalName = result.originalName;
    dto.domain = result.domain;
    dto.entityType = result.entityType;
    dto.entityId = result.entityId;
    dto.uploadedBy = result.uploadedBy;
    dto.visibility = result.visibility;
    dto.status = result.status;
    dto.publicUrl = result.publicUrl;
    dto.createdAt = result.createdAt;
    return dto;
  }
}
