import { ApiProperty } from '@nestjs/swagger';
import { SupplierDocumentStatus, SupplierDocumentType } from '@prisma/client';

export class SupplierDocumentVersionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  storageObjectId!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  size!: number;

  @ApiProperty()
  originalName!: string;
}

export class SupplierDocumentRowResponseDto {
  @ApiProperty({ enum: SupplierDocumentType })
  documentType!: SupplierDocumentType;

  @ApiProperty()
  label!: string;

  @ApiProperty({ enum: ['REQUIRED', 'CONDITIONAL', 'RECOMMENDED'] })
  requirement!: 'REQUIRED' | 'CONDITIONAL' | 'RECOMMENDED';

  @ApiProperty({ enum: SupplierDocumentStatus })
  status!: SupplierDocumentStatus;

  @ApiProperty({ nullable: true })
  issuedAt!: Date | null;

  @ApiProperty({ nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ nullable: true })
  lastUploadedAt!: Date | null;

  @ApiProperty({ nullable: true })
  uploadedByUserId!: string | null;

  @ApiProperty()
  needsReview!: boolean;

  @ApiProperty({ enum: ['NONE', 'WARNING', 'URGENT'] })
  alertLevel!: 'NONE' | 'WARNING' | 'URGENT';

  @ApiProperty({ type: SupplierDocumentVersionResponseDto, nullable: true })
  currentVersion!: SupplierDocumentVersionResponseDto | null;

  @ApiProperty({ type: SupplierDocumentVersionResponseDto, nullable: true })
  previousVersion!: Pick<
    SupplierDocumentVersionResponseDto,
    'id' | 'versionNumber' | 'mimeType' | 'originalName'
  > | null;
}

export class SupplierDocumentsCompletenessResponseDto {
  @ApiProperty()
  loaded!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [String], enum: SupplierDocumentType })
  requiredPending!: SupplierDocumentType[];
}

export class ListSupplierDocumentsResponseDto {
  @ApiProperty({ type: SupplierDocumentsCompletenessResponseDto })
  completeness!: SupplierDocumentsCompletenessResponseDto;

  @ApiProperty({ type: [SupplierDocumentRowResponseDto] })
  documents!: SupplierDocumentRowResponseDto[];
}

export class SupplierDocumentDownloadUrlDto {
  @ApiProperty()
  url!: string;
}
