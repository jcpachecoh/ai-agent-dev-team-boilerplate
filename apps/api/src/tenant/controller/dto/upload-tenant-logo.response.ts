import { ApiProperty } from '@nestjs/swagger';

export class UploadTenantLogoResponseDto {
  @ApiProperty({ example: 'https://cdn.opssynk.com/tenants/palos-de-lena/branding/uuid.webp' })
  logoUrl!: string;
}

export interface UploadedLogoFileDto {
  mimetype: string;
  buffer: Buffer;
  originalname: string;
  size: number;
}
