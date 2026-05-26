import { Test, TestingModule } from '@nestjs/testing';
import { CasesRepository } from '../repository/cases.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const prismaMock = {
  testCase: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userTestLab: {
    upsert: jest.fn(),
  },
};

describe('CasesRepository', () => {
  let repository: CasesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasesRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<CasesRepository>(CasesRepository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('queries testCase.findMany with suiteId and asc order', async () => {
      prismaMock.testCase.findMany.mockResolvedValue([]);
      await repository.findAll('suite-1');
      expect(prismaMock.testCase.findMany).toHaveBeenCalledWith({
        where: { suiteId: 'suite-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('queries testCase.findFirst with id and suiteId', async () => {
      prismaMock.testCase.findFirst.mockResolvedValue(null);
      await repository.findOne('suite-1', 'case-1');
      expect(prismaMock.testCase.findFirst).toHaveBeenCalledWith({
        where: { id: 'case-1', suiteId: 'suite-1' },
      });
    });
  });

  describe('create', () => {
    it('calls testCase.create with provided data', async () => {
      const data = {
        title: 'Login',
        suiteId: 'suite-1',
        createdById: 'u1',
        priority: 'MEDIUM' as const,
        type: 'FUNCTIONAL' as const,
      };
      prismaMock.testCase.create.mockResolvedValue({ id: 'c1', ...data });
      await repository.create(data as any);
      expect(prismaMock.testCase.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('updateStatus', () => {
    it('calls testCase.update with id and status', async () => {
      prismaMock.testCase.update.mockResolvedValue({ id: 'c1', status: 'PASS' });
      await repository.updateStatus('c1', 'PASS' as any);
      expect(prismaMock.testCase.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: 'PASS' },
      });
    });
  });

  describe('findOrCreateSystemUser', () => {
    it('upserts system user and selects id', async () => {
      prismaMock.userTestLab.upsert.mockResolvedValue({ id: 'sys-1' });
      const result = await repository.findOrCreateSystemUser();
      expect(result).toEqual({ id: 'sys-1' });
      expect(prismaMock.userTestLab.upsert).toHaveBeenCalledWith({
        where: { email: 'system@testlab.local' },
        update: {},
        create: { email: 'system@testlab.local', name: 'System', passwordHash: '' },
        select: { id: true },
      });
    });
  });
});
