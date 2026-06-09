import { Injectable } from '@nestjs/common';
import { ProductionCommitteeStatus, type Prisma, type ProductionCommittee } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CommitteeWithMembers } from '../interfaces/committee.interfaces';
import type { ListCommitteesFilters } from '../interfaces/committee.interfaces';

const COMMITTEE_DETAIL_INCLUDE = {
  members: {
    include: {
      user: {
        select: {
          email: true,
          role: { select: { code: true } },
        },
      },
    },
  },
} satisfies Prisma.ProductionCommitteeInclude;

@Injectable()
export class CommitteeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(
    tenantId: string,
    filters: ListCommitteesFilters,
  ): Promise<ProductionCommittee[]> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    return this.prisma.productionCommittee.findMany({
      where: {
        tenantId,
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  findDetailById(tenantId: string, id: string): Promise<CommitteeWithMembers | null> {
    return this.prisma.productionCommittee.findFirst({
      where: { id, tenantId },
      include: COMMITTEE_DETAIL_INCLUDE,
    }) as Promise<CommitteeWithMembers | null>;
  }

  findAllNumbersByTenant(tenantId: string): Promise<Array<{ number: string }>> {
    return this.prisma.productionCommittee.findMany({
      where: { tenantId },
      select: { number: true },
    });
  }

  findById(tenantId: string, id: string): Promise<ProductionCommittee | null> {
    return this.prisma.productionCommittee.findFirst({
      where: { id, tenantId },
    });
  }

  async createCommitteeWithMembersTx(input: {
    tenantId: string;
    number: string;
    status: ProductionCommitteeStatus;
    memberUserIds: string[];
  }): Promise<CommitteeWithMembers> {
    return this.prisma.$transaction(async (tx) => {
      const committee = await tx.productionCommittee.create({
        data: {
          tenantId: input.tenantId,
          number: input.number,
          status: input.status,
          members: {
            create: input.memberUserIds.map((userId) => ({ userId })),
          },
        },
        include: COMMITTEE_DETAIL_INCLUDE,
      });

      return committee as CommitteeWithMembers;
    });
  }

  async updateCommitteeTx(
    tenantId: string,
    id: string,
    data: {
      status?: ProductionCommitteeStatus;
      memberUserIds?: string[];
    },
  ): Promise<CommitteeWithMembers> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.productionCommittee.findFirst({
        where: { id, tenantId },
      });
      if (!existing) {
        throw new Error(`Committee not found: ${id}`);
      }

      if (data.memberUserIds !== undefined) {
        await tx.productionCommitteeMember.deleteMany({
          where: { committeeId: id },
        });
        if (data.memberUserIds.length > 0) {
          await tx.productionCommitteeMember.createMany({
            data: data.memberUserIds.map((userId) => ({
              committeeId: id,
              userId,
            })),
          });
        }
      }

      const committee = await tx.productionCommittee.update({
        where: { id },
        data: {
          ...(data.status !== undefined ? { status: data.status } : {}),
        },
        include: COMMITTEE_DETAIL_INCLUDE,
      });

      return committee as CommitteeWithMembers;
    });
  }

  async incrementOrdersCountTx(tx: Prisma.TransactionClient, committeeId: string): Promise<void> {
    await tx.productionCommittee.update({
      where: { id: committeeId },
      data: { ordersCount: { increment: 1 } },
    });
  }

  countMembers(committeeId: string): Promise<number> {
    return this.prisma.productionCommitteeMember.count({
      where: { committeeId },
    });
  }
}
