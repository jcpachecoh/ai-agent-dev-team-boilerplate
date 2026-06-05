import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductionCommitteeStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CommitteeRepository } from '../repository/committee.repository';
import { CommitteeService } from '../service/committee.service';

const tenantId = 'palos-de-lena';

const operationsAdminUser = {
  id: 'user-ops-1',
  tenantId,
  email: 'ops-admin@palos-de-lena.dev',
  isActive: true,
  deletedAt: null,
  role: { code: 'OPERATIONS_ADMIN' },
};

const committeeDetail = {
  id: 'committee-1',
  tenantId,
  number: 'OP0001',
  status: ProductionCommitteeStatus.DRAFT,
  ordersCount: 0,
  createdAt: new Date('2026-06-05T08:00:00Z'),
  updatedAt: new Date('2026-06-05T08:00:00Z'),
  members: [
    {
      userId: operationsAdminUser.id,
      user: {
        email: operationsAdminUser.email,
        role: { code: 'OPERATIONS_ADMIN' },
      },
    },
  ],
};

const committeeRepositoryMock = {
  findAllNumbersByTenant: jest.fn(),
  createCommitteeWithMembersTx: jest.fn(),
  findAllByTenant: jest.fn(),
  findDetailById: jest.fn(),
  findById: jest.fn(),
  updateCommitteeTx: jest.fn(),
  countMembers: jest.fn(),
};

const prismaMock = {
  user: {
    findMany: jest.fn(),
  },
};

describe('CommitteeService', () => {
  let service: CommitteeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommitteeService,
        { provide: CommitteeRepository, useValue: committeeRepositoryMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CommitteeService>(CommitteeService);
    jest.clearAllMocks();
  });

  describe('createCommittee', () => {
    beforeEach(() => {
      prismaMock.user.findMany.mockResolvedValue([operationsAdminUser]);
      committeeRepositoryMock.findAllNumbersByTenant.mockResolvedValue([]);
      committeeRepositoryMock.createCommitteeWithMembersTx.mockResolvedValue(committeeDetail);
    });

    it('assigns OP0001 to the first committee in a tenant', async () => {
      const result = await service.createCommittee(tenantId, {
        memberUserIds: [operationsAdminUser.id],
      });

      expect(result.number).toBe('OP0001');
      expect(committeeRepositoryMock.createCommitteeWithMembersTx).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          number: 'OP0001',
          memberUserIds: [operationsAdminUser.id],
        }),
      );
    });

    it('assigns OP0002 when OP0001 already exists', async () => {
      committeeRepositoryMock.findAllNumbersByTenant.mockResolvedValue([{ number: 'OP0001' }]);
      committeeRepositoryMock.createCommitteeWithMembersTx.mockResolvedValue({
        ...committeeDetail,
        number: 'OP0002',
      });

      const result = await service.createCommittee(tenantId, {
        memberUserIds: [operationsAdminUser.id],
      });

      expect(result.number).toBe('OP0002');
    });

    it('rejects members without OPERATIONS_ADMIN role', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          ...operationsAdminUser,
          role: { code: 'SUPERVISOR' },
        },
      ]);

      await expect(
        service.createCommittee(tenantId, {
          memberUserIds: [operationsAdminUser.id],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects empty memberUserIds', async () => {
      await expect(
        service.createCommittee(tenantId, {
          memberUserIds: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates committee with ACTIVE initial status', async () => {
      committeeRepositoryMock.createCommitteeWithMembersTx.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.ACTIVE,
      });

      const result = await service.createCommittee(tenantId, {
        memberUserIds: [operationsAdminUser.id],
        status: ProductionCommitteeStatus.ACTIVE,
      });

      expect(result.status).toBe(ProductionCommitteeStatus.ACTIVE);
    });

    it('rejects invalid initial status', async () => {
      await expect(
        service.createCommittee(tenantId, {
          memberUserIds: [operationsAdminUser.id],
          status: ProductionCommitteeStatus.CLOSED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate member user IDs', async () => {
      await expect(
        service.createCommittee(tenantId, {
          memberUserIds: [operationsAdminUser.id, operationsAdminUser.id],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when member user is not found', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      await expect(
        service.createCommittee(tenantId, {
          memberUserIds: [operationsAdminUser.id],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when committee number limit is reached', async () => {
      committeeRepositoryMock.findAllNumbersByTenant.mockResolvedValue([{ number: 'OP9999' }]);

      await expect(
        service.createCommittee(tenantId, {
          memberUserIds: [operationsAdminUser.id],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listCommittees', () => {
    it('maps committees with member counts', async () => {
      committeeRepositoryMock.findAllByTenant.mockResolvedValue([
        {
          id: 'c1',
          number: 'OP0001',
          status: ProductionCommitteeStatus.ACTIVE,
          ordersCount: 2,
          createdAt: new Date('2026-06-05T08:00:00Z'),
        },
      ]);
      committeeRepositoryMock.countMembers.mockResolvedValue(1);

      const result = await service.listCommittees(tenantId, {});

      expect(result).toEqual([
        expect.objectContaining({
          id: 'c1',
          number: 'OP0001',
          memberCount: 1,
          ordersCount: 2,
        }),
      ]);
    });
  });

  describe('getCommitteeDetail', () => {
    it('returns committee detail', async () => {
      committeeRepositoryMock.findDetailById.mockResolvedValue(committeeDetail);

      const result = await service.getCommitteeDetail(tenantId, committeeDetail.id);

      expect(result.id).toBe(committeeDetail.id);
      expect(result.members).toHaveLength(1);
    });

    it('throws when committee is missing', async () => {
      committeeRepositoryMock.findDetailById.mockResolvedValue(null);

      await expect(service.getCommitteeDetail(tenantId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCommittee', () => {
    beforeEach(() => {
      committeeRepositoryMock.findById.mockResolvedValue(committeeDetail);
      committeeRepositoryMock.updateCommitteeTx.mockResolvedValue(committeeDetail);
      prismaMock.user.findMany.mockResolvedValue([operationsAdminUser]);
    });

    it('activates committee when it has members', async () => {
      committeeRepositoryMock.countMembers.mockResolvedValue(1);
      committeeRepositoryMock.updateCommitteeTx.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.ACTIVE,
      });

      const result = await service.updateCommittee(tenantId, committeeDetail.id, {
        status: ProductionCommitteeStatus.ACTIVE,
      });

      expect(result.status).toBe(ProductionCommitteeStatus.ACTIVE);
    });

    it('rejects activating committee without members', async () => {
      committeeRepositoryMock.countMembers.mockResolvedValue(0);

      await expect(
        service.updateCommittee(tenantId, committeeDetail.id, {
          status: ProductionCommitteeStatus.ACTIVE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects status change from CLOSED', async () => {
      committeeRepositoryMock.findById.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.CLOSED,
      });

      await expect(
        service.updateCommittee(tenantId, committeeDetail.id, {
          status: ProductionCommitteeStatus.ACTIVE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects cancelling ACTIVE committee with orders', async () => {
      committeeRepositoryMock.findById.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.ACTIVE,
        ordersCount: 3,
      });

      await expect(
        service.updateCommittee(tenantId, committeeDetail.id, {
          status: ProductionCommitteeStatus.CANCELLED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listEligibleMembers', () => {
    it('returns OPERATIONS_ADMIN users', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: operationsAdminUser.id,
          email: operationsAdminUser.email,
          role: { code: 'OPERATIONS_ADMIN' },
        },
      ]);

      const result = await service.listEligibleMembers(tenantId);

      expect(result).toEqual([
        {
          userId: operationsAdminUser.id,
          email: operationsAdminUser.email,
          roleCode: 'OPERATIONS_ADMIN',
        },
      ]);
    });
  });

  describe('closeCommittee', () => {
    it('closes an ACTIVE committee', async () => {
      committeeRepositoryMock.findById.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.ACTIVE,
      });
      committeeRepositoryMock.updateCommitteeTx.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.CLOSED,
      });

      const result = await service.closeCommittee(tenantId, committeeDetail.id);

      expect(result.status).toBe(ProductionCommitteeStatus.CLOSED);
    });

    it('rejects closing a DRAFT committee', async () => {
      committeeRepositoryMock.findById.mockResolvedValue(committeeDetail);

      await expect(service.closeCommittee(tenantId, committeeDetail.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('assertCommitteeActiveForOrder', () => {
    it('allows ACTIVE committees', async () => {
      committeeRepositoryMock.findById.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.ACTIVE,
      });

      await expect(
        service.assertCommitteeActiveForOrder(tenantId, committeeDetail.id),
      ).resolves.toEqual(
        expect.objectContaining({
          id: committeeDetail.id,
          number: committeeDetail.number,
          status: ProductionCommitteeStatus.ACTIVE,
        }),
      );
    });

    it('rejects CLOSED committees', async () => {
      committeeRepositoryMock.findById.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.CLOSED,
      });

      await expect(
        service.assertCommitteeActiveForOrder(tenantId, committeeDetail.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when committee is not found', async () => {
      committeeRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.assertCommitteeActiveForOrder(tenantId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('closeCommittee edge cases', () => {
    it('returns detail when committee is already CLOSED', async () => {
      committeeRepositoryMock.findById.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.CLOSED,
      });
      committeeRepositoryMock.findDetailById.mockResolvedValue({
        ...committeeDetail,
        status: ProductionCommitteeStatus.CLOSED,
      });

      const result = await service.closeCommittee(tenantId, committeeDetail.id);

      expect(result.status).toBe(ProductionCommitteeStatus.CLOSED);
      expect(committeeRepositoryMock.updateCommitteeTx).not.toHaveBeenCalled();
    });
  });
});
