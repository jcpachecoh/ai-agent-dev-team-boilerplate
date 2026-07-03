import { Test, TestingModule } from '@nestjs/testing';
import { ProductionCommitteeStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CommitteeRepository } from '../repository/committee.repository';

const tenantId = 'palos-de-lena';

const txMock = {
  productionCommittee: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  productionCommitteeMember: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
};

const prismaMock = {
  productionCommittee: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  productionCommitteeMember: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('CommitteeRepository', () => {
  let repository: CommitteeRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommitteeRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<CommitteeRepository>(CommitteeRepository);
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => unknown) =>
      cb(txMock),
    );
  });

  describe('findAllByTenant', () => {
    it('applies pagination and optional status filter', async () => {
      prismaMock.productionCommittee.findMany.mockResolvedValue([]);

      await repository.findAllByTenant(tenantId, {
        status: ProductionCommitteeStatus.ACTIVE,
        page: 2,
        limit: 10,
      });

      expect(prismaMock.productionCommittee.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: ProductionCommitteeStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });

    it('uses default page and limit when omitted', async () => {
      prismaMock.productionCommittee.findMany.mockResolvedValue([]);

      await repository.findAllByTenant(tenantId, {});

      expect(prismaMock.productionCommittee.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
    });
  });

  describe('findDetailById', () => {
    it('queries committee with members include', async () => {
      prismaMock.productionCommittee.findFirst.mockResolvedValue({ id: 'c1' });

      await repository.findDetailById(tenantId, 'c1');

      expect(prismaMock.productionCommittee.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1', tenantId },
          include: expect.objectContaining({ members: expect.any(Object) }),
        }),
      );
    });
  });

  describe('findAllNumbersByTenant', () => {
    it('selects only committee numbers', async () => {
      prismaMock.productionCommittee.findMany.mockResolvedValue([{ number: 'OP0001' }]);

      const result = await repository.findAllNumbersByTenant(tenantId);

      expect(result).toEqual([{ number: 'OP0001' }]);
      expect(prismaMock.productionCommittee.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        select: { number: true },
      });
    });
  });

  describe('findById', () => {
    it('queries by tenant and id', async () => {
      prismaMock.productionCommittee.findFirst.mockResolvedValue({ id: 'c1' });

      await repository.findById(tenantId, 'c1');

      expect(prismaMock.productionCommittee.findFirst).toHaveBeenCalledWith({
        where: { id: 'c1', tenantId },
      });
    });
  });

  describe('createCommitteeWithMembersTx', () => {
    it('creates committee and members in a transaction', async () => {
      const created = { id: 'c1', number: 'OP0001', members: [] };
      txMock.productionCommittee.create.mockResolvedValue(created);

      const result = await repository.createCommitteeWithMembersTx({
        tenantId,
        number: 'OP0001',
        status: ProductionCommitteeStatus.DRAFT,
        memberUserIds: ['user-1', 'user-2'],
      });

      expect(result).toEqual(created);
      expect(txMock.productionCommittee.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          number: 'OP0001',
          status: ProductionCommitteeStatus.DRAFT,
          members: {
            create: [{ userId: 'user-1' }, { userId: 'user-2' }],
          },
        },
        include: expect.any(Object),
      });
    });
  });

  describe('updateCommitteeTx', () => {
    it('throws when committee does not exist', async () => {
      txMock.productionCommittee.findFirst.mockResolvedValue(null);

      await expect(
        repository.updateCommitteeTx(tenantId, 'missing', {
          status: ProductionCommitteeStatus.ACTIVE,
        }),
      ).rejects.toThrow('Committee not found: missing');
    });

    it('replaces members and updates status', async () => {
      txMock.productionCommittee.findFirst.mockResolvedValue({ id: 'c1' });
      txMock.productionCommittee.update.mockResolvedValue({
        id: 'c1',
        status: ProductionCommitteeStatus.ACTIVE,
        members: [],
      });

      await repository.updateCommitteeTx(tenantId, 'c1', {
        status: ProductionCommitteeStatus.ACTIVE,
        memberUserIds: ['user-1'],
      });

      expect(txMock.productionCommitteeMember.deleteMany).toHaveBeenCalledWith({
        where: { committeeId: 'c1' },
      });
      expect(txMock.productionCommitteeMember.createMany).toHaveBeenCalledWith({
        data: [{ committeeId: 'c1', userId: 'user-1' }],
      });
      expect(txMock.productionCommittee.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: ProductionCommitteeStatus.ACTIVE },
        include: expect.any(Object),
      });
    });

    it('clears members when memberUserIds is empty', async () => {
      txMock.productionCommittee.findFirst.mockResolvedValue({ id: 'c1' });
      txMock.productionCommittee.update.mockResolvedValue({ id: 'c1', members: [] });

      await repository.updateCommitteeTx(tenantId, 'c1', { memberUserIds: [] });

      expect(txMock.productionCommitteeMember.deleteMany).toHaveBeenCalled();
      expect(txMock.productionCommitteeMember.createMany).not.toHaveBeenCalled();
    });

    it('updates status only when memberUserIds omitted', async () => {
      txMock.productionCommittee.findFirst.mockResolvedValue({ id: 'c1' });
      txMock.productionCommittee.update.mockResolvedValue({ id: 'c1', members: [] });

      await repository.updateCommitteeTx(tenantId, 'c1', {
        status: ProductionCommitteeStatus.CLOSED,
      });

      expect(txMock.productionCommitteeMember.deleteMany).not.toHaveBeenCalled();
      expect(txMock.productionCommittee.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: ProductionCommitteeStatus.CLOSED },
        include: expect.any(Object),
      });
    });
  });

  describe('incrementOrdersCountTx', () => {
    it('increments ordersCount on committee', async () => {
      await repository.incrementOrdersCountTx(txMock as never, 'c1');

      expect(txMock.productionCommittee.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { ordersCount: { increment: 1 } },
      });
    });
  });

  describe('countMembers', () => {
    it('counts members for committee', async () => {
      prismaMock.productionCommitteeMember.count.mockResolvedValue(3);

      const count = await repository.countMembers('c1');

      expect(count).toBe(3);
      expect(prismaMock.productionCommitteeMember.count).toHaveBeenCalledWith({
        where: { committeeId: 'c1' },
      });
    });
  });
});
