import { ApiProperty } from '@nestjs/swagger';

export class UploadTenantLogoResponseDto {
  @ApiProperty({ example: '/api/tenant/logo/palos-de-lena' })
  logoUrl!: string;
}

export interface UploadedLogoFileDto {
  mimetype: string;
  buffer: Buffer;
}
