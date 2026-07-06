import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceCollaboratorAuditEntryDto {
  @ApiProperty() id!: string;
  @ApiProperty() action!: string;
  @ApiPropertyOptional({ nullable: true }) actorName!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiPropertyOptional({ nullable: true }) oldValue!: unknown;
  @ApiPropertyOptional({ nullable: true }) newValue!: unknown;
}

export class AttendanceCollaboratorAuditResponseDto {
  @ApiProperty({ type: [AttendanceCollaboratorAuditEntryDto] })
  items!: AttendanceCollaboratorAuditEntryDto[];
}
