import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'URL firmada con tiempo de expiración limitado' })
  url!: string;

  @ApiProperty({ description: 'Tiempo de expiración en segundos' })
  expiresInSeconds!: number;
}
