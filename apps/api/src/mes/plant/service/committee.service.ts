import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductionCommitteeStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CommitteeDetailResponse,
  CommitteeListItemResponse,
  CommitteeWithMembers,
  CreateCommitteeInput,
  EligibleCommitteeMemberResponse,
  ListCommitteesFilters,
  UpdateCommitteeInput,
} from '../interfaces/committee.interfaces';
import { OPERATIONS_ADMIN_ROLE_CODE } from '../interfaces/committee.interfaces';
import { CommitteeRepository } from '../repository/committee.repository';

@Injectable()
export class CommitteeService {
  constructor(
    private readonly committeeRepository: CommitteeRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createCommittee(
    tenantId: string,
    input: CreateCommitteeInput,
  ): Promise<CommitteeDetailResponse> {
    this.validateMemberUserIds(input.memberUserIds);
    await this.validateOperationsAdminMembers(tenantId, input.memberUserIds);

    const status = input.status ?? ProductionCommitteeStatus.DRAFT;
    if (status !== ProductionCommitteeStatus.DRAFT && status !== ProductionCommitteeStatus.ACTIVE) {
      throw new BadRequestException('Initial committee status must be DRAFT or ACTIVE');
    }

    const number = await this.generateCommitteeNumber(tenantId);
    const committee = await this.committeeRepository.createCommitteeWithMembersTx({
      tenantId,
      number,
      status,
      memberUserIds: input.memberUserIds,
    });

    return this.mapCommitteeDetail(committee);
  }

  async listCommittees(
    tenantId: string,
    filters: ListCommitteesFilters,
  ): Promise<CommitteeListItemResponse[]> {
    const committees = await this.committeeRepository.findAllByTenant(tenantId, filters);

    return Promise.all(
      committees.map(async (committee) => ({
        id: committee.id,
        number: committee.number,
        status: committee.status,
        ordersCount: committee.ordersCount,
        memberCount: await this.committeeRepository.countMembers(committee.id),
        createdAt: committee.createdAt,
      })),
    );
  }

  async getCommitteeDetail(tenantId: string, id: string): Promise<CommitteeDetailResponse> {
    const committee = await this.requireCommitteeDetail(tenantId, id);
    return this.mapCommitteeDetail(committee);
  }

  async updateCommittee(
    tenantId: string,
    id: string,
    input: UpdateCommitteeInput,
  ): Promise<CommitteeDetailResponse> {
    const existing = await this.requireCommittee(tenantId, id);

    if (input.memberUserIds !== undefined) {
      this.validateMemberUserIds(input.memberUserIds);
      await this.validateOperationsAdminMembers(tenantId, input.memberUserIds);
    }

    if (input.status !== undefined) {
      this.validateStatusTransition(existing.status, input.status, existing.ordersCount);
    }

    if (input.status === ProductionCommitteeStatus.ACTIVE && input.memberUserIds === undefined) {
      const memberCount = await this.committeeRepository.countMembers(id);
      if (memberCount < 1) {
        throw new BadRequestException('Committee must have at least one member to become ACTIVE');
      }
    }

    const committee = await this.committeeRepository.updateCommitteeTx(tenantId, id, {
      status: input.status,
      memberUserIds: input.memberUserIds,
    });

    return this.mapCommitteeDetail(committee);
  }

  async closeCommittee(tenantId: string, id: string): Promise<CommitteeDetailResponse> {
    const existing = await this.requireCommittee(tenantId, id);

    if (existing.status === ProductionCommitteeStatus.CLOSED) {
      const detail = await this.requireCommitteeDetail(tenantId, id);
      return this.mapCommitteeDetail(detail);
    }

    if (existing.status !== ProductionCommitteeStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot close committee in status ${existing.status}; only ACTIVE committees can be closed`,
      );
    }

    const committee = await this.committeeRepository.updateCommitteeTx(tenantId, id, {
      status: ProductionCommitteeStatus.CLOSED,
    });

    return this.mapCommitteeDetail(committee);
  }

  async listEligibleMembers(tenantId: string): Promise<EligibleCommitteeMemberResponse[]> {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
        role: { code: OPERATIONS_ADMIN_ROLE_CODE },
      },
      select: {
        id: true,
        email: true,
        role: { select: { code: true } },
      },
      orderBy: { email: 'asc' },
    });

    return users.map((user) => ({
      userId: user.id,
      email: user.email,
      roleCode: user.role.code,
    }));
  }

  async assertCommitteeActiveForOrder(tenantId: string, committeeId: string) {
    const committee = await this.committeeRepository.findById(tenantId, committeeId);
    if (!committee) {
      throw new NotFoundException(`Production committee with ID "${committeeId}" not found`);
    }
    if (committee.status !== ProductionCommitteeStatus.ACTIVE) {
      throw new BadRequestException(
        `Production committee "${committee.number}" is not ACTIVE (current status: ${committee.status})`,
      );
    }
    return committee;
  }

  private async requireCommittee(tenantId: string, id: string) {
    const committee = await this.committeeRepository.findById(tenantId, id);
    if (!committee) {
      throw new NotFoundException(`Production committee with ID "${id}" not found`);
    }
    return committee;
  }

  private async requireCommitteeDetail(
    tenantId: string,
    id: string,
  ): Promise<CommitteeWithMembers> {
    const committee = await this.committeeRepository.findDetailById(tenantId, id);
    if (!committee) {
      throw new NotFoundException(`Production committee with ID "${id}" not found`);
    }
    return committee;
  }

  private validateMemberUserIds(memberUserIds: string[]): void {
    if (!memberUserIds || memberUserIds.length < 1) {
      throw new BadRequestException('At least one committee member is required');
    }
  }

  private async validateOperationsAdminMembers(
    tenantId: string,
    memberUserIds: string[],
  ): Promise<void> {
    const uniqueIds = [...new Set(memberUserIds)];
    if (uniqueIds.length !== memberUserIds.length) {
      throw new BadRequestException('Duplicate member user IDs are not allowed');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: memberUserIds },
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      include: { role: { select: { code: true } } },
    });

    if (users.length !== memberUserIds.length) {
      throw new BadRequestException(
        'One or more committee members were not found, are inactive, or belong to another tenant',
      );
    }

    for (const user of users) {
      if (user.role.code !== OPERATIONS_ADMIN_ROLE_CODE) {
        throw new BadRequestException(
          `User "${user.email}" does not have role ${OPERATIONS_ADMIN_ROLE_CODE}`,
        );
      }
    }
  }

  private validateStatusTransition(
    from: ProductionCommitteeStatus,
    to: ProductionCommitteeStatus,
    ordersCount: number,
  ): void {
    if (from === to) {
      return;
    }

    if (from === ProductionCommitteeStatus.CLOSED || from === ProductionCommitteeStatus.CANCELLED) {
      throw new BadRequestException(`Cannot change status from ${from}`);
    }

    if (to === ProductionCommitteeStatus.CANCELLED && from === ProductionCommitteeStatus.ACTIVE) {
      if (ordersCount > 0) {
        throw new BadRequestException(
          'Cannot cancel an ACTIVE committee that already has production orders',
        );
      }
    }
  }

  private async generateCommitteeNumber(tenantId: string): Promise<string> {
    const committees = await this.committeeRepository.findAllNumbersByTenant(tenantId);

    let maxSeq = 0;
    for (const committee of committees) {
      const seq = this.parseCommitteeSequence(committee.number);
      if (seq !== null && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const next = maxSeq + 1;
    if (next > 9999) {
      throw new ConflictException('Production committee number limit reached (OP9999)');
    }

    return `OP${String(next).padStart(4, '0')}`;
  }

  private parseCommitteeSequence(number: string): number | null {
    const match = /^OP(\d{4})$/i.exec(number.trim());
    if (!match) {
      return null;
    }
    const seq = Number.parseInt(match[1], 10);
    return Number.isNaN(seq) ? null : seq;
  }

  private mapCommitteeDetail(committee: CommitteeWithMembers): CommitteeDetailResponse {
    return {
      id: committee.id,
      tenantId: committee.tenantId,
      number: committee.number,
      status: committee.status,
      ordersCount: committee.ordersCount,
      members: committee.members.map((member) => ({
        userId: member.userId,
        email: member.user.email,
        roleCode: member.user.role.code,
      })),
      createdAt: committee.createdAt,
      updatedAt: committee.updatedAt,
    };
  }
}
