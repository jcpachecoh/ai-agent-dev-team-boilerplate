import { ApiProperty } from '@nestjs/swagger';
import { ProductionCommitteeStatus } from '@prisma/client';

export class EligibleCommitteeMemberResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId!: string;

  @ApiProperty({ example: 'ops-admin@palos-de-lena.dev' })
  email!: string;

  @ApiProperty({ example: 'OPERATIONS_ADMIN' })
  roleCode!: string;
}

export class CommitteeMemberResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId!: string;

  @ApiProperty({ example: 'ops-admin@palos-de-lena.dev' })
  email!: string;

  @ApiProperty({ example: 'OPERATIONS_ADMIN' })
  roleCode!: string;
}

export class CommitteeDetailResponseDto {
  @ApiProperty({ example: 'committee-uuid' })
  id!: string;

  @ApiProperty({ example: 'palos-de-lena' })
  tenantId!: string;

  @ApiProperty({ example: 'OP0001' })
  number!: string;

  @ApiProperty({ enum: ProductionCommitteeStatus })
  status!: ProductionCommitteeStatus;

  @ApiProperty({ example: 3 })
  ordersCount!: number;

  @ApiProperty({ type: [CommitteeMemberResponseDto] })
  members!: CommitteeMemberResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CommitteeListItemResponseDto {
  @ApiProperty({ example: 'committee-uuid' })
  id!: string;

  @ApiProperty({ example: 'OP0001' })
  number!: string;

  @ApiProperty({ enum: ProductionCommitteeStatus })
  status!: ProductionCommitteeStatus;

  @ApiProperty({ example: 3 })
  ordersCount!: number;

  @ApiProperty({ example: 2 })
  memberCount!: number;

  @ApiProperty()
  createdAt!: Date;
}
