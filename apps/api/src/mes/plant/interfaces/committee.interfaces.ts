import type { ProductionCommitteeStatus } from '@prisma/client';

export const OPERATIONS_ADMIN_ROLE_CODE = 'OPERATIONS_ADMIN';

export interface CreateCommitteeInput {
  memberUserIds: string[];
  status?: ProductionCommitteeStatus;
}

export interface UpdateCommitteeInput {
  status?: ProductionCommitteeStatus;
  memberUserIds?: string[];
}

export interface ListCommitteesFilters {
  status?: ProductionCommitteeStatus;
  page?: number;
  limit?: number;
}

export interface CommitteeMemberResponse {
  userId: string;
  email: string;
  roleCode: string;
}

export interface EligibleCommitteeMemberResponse {
  userId: string;
  email: string;
  roleCode: string;
}

export interface CommitteeDetailResponse {
  id: string;
  tenantId: string;
  number: string;
  status: ProductionCommitteeStatus;
  ordersCount: number;
  members: CommitteeMemberResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommitteeListItemResponse {
  id: string;
  number: string;
  status: ProductionCommitteeStatus;
  ordersCount: number;
  memberCount: number;
  createdAt: Date;
}

export type CommitteeWithMembers = {
  id: string;
  tenantId: string;
  number: string;
  status: ProductionCommitteeStatus;
  ordersCount: number;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    userId: string;
    user: {
      email: string;
      role: { code: string };
    };
  }>;
};
