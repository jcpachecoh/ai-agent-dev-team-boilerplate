import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CasesService } from './cases.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ResultStatus } from './dto/update-case-status.dto';

const systemUser = { id: 'user-sys', email: 'system@testlab.local', name: 'System' };
const mockCase = {
  id: 'case-1',
  title: 'Login with valid credentials',
  priority: 'HIGH',
  type: 'FUNCTIONAL',
  status: 'UNTESTED',
  preconditions: null,
  expectedResult: null,
  sectionId: null,
  suiteId: 'suite-1',
  createdById: 'user-sys',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  testCase: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    upsert: jest.fn(),
  },
};

describe('CasesService', () => {
  let service: CasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<CasesService>(CasesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns test cases for suite ordered by createdAt asc', async () => {
      prismaMock.testCase.findMany.mockResolvedValue([mockCase]);
      const result = await service.findAll('suite-1');
      expect(result).toEqual([mockCase]);
      expect(prismaMock.testCase.findMany).toHaveBeenCalledWith({
        where: { suiteId: 'suite-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns test case when found', async () => {
      prismaMock.testCase.findFirst.mockResolvedValue(mockCase);
      const result = await service.findOne('suite-1', 'case-1');
      expect(result).toEqual(mockCase);
    });

    it('throws NotFoundException when not found', async () => {
      prismaMock.testCase.findFirst.mockResolvedValue(null);
      await expect(service.findOne('suite-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('upserts system user and creates test case with defaults', async () => {
      const dto = { title: 'Login with valid credentials' };
      prismaMock.user.upsert.mockResolvedValue(systemUser);
      prismaMock.testCase.create.mockResolvedValue(mockCase);

      const result = await service.create('suite-1', dto as any);
      expect(result).toEqual(mockCase);
      expect(prismaMock.user.upsert).toHaveBeenCalledWith({
        where: { email: 'system@testlab.local' },
        update: {},
        create: { email: 'system@testlab.local', name: 'System' },
      });
      expect(prismaMock.testCase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Login with valid credentials',
          priority: 'MEDIUM',
          type: 'FUNCTIONAL',
          suiteId: 'suite-1',
          createdById: 'user-sys',
        }),
      });
    });

    it('uses provided priority and type', async () => {
      const dto = { title: 'Login', priority: 'HIGH' as const, type: 'SMOKE' as const };
      prismaMock.user.upsert.mockResolvedValue(systemUser);
      prismaMock.testCase.create.mockResolvedValue({
        ...mockCase,
        priority: 'HIGH',
        type: 'SMOKE',
      });

      await service.create('suite-1', dto as any);
      expect(prismaMock.testCase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ priority: 'HIGH', type: 'SMOKE' }),
      });
    });
  });

  describe('updateStatus', () => {
    it('updates status when case exists', async () => {
      prismaMock.testCase.findFirst.mockResolvedValue(mockCase);
      prismaMock.testCase.update.mockResolvedValue({ ...mockCase, status: 'PASS' });

      const dto = { status: ResultStatus.PASS };
      const result = await service.updateStatus('suite-1', 'case-1', dto);
      expect(result.status).toBe('PASS');
      expect(prismaMock.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { status: 'PASS' },
      });
    });

    it('throws NotFoundException when case does not exist', async () => {
      prismaMock.testCase.findFirst.mockResolvedValue(null);
      await expect(
        service.updateStatus('suite-1', 'bad', { status: ResultStatus.FAIL }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
