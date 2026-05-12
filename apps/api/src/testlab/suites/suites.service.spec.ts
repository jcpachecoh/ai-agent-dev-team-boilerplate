import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SuitesService } from './suites.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockSuite = {
  id: 'suite-1',
  name: 'Smoke Tests',
  description: null,
  projectId: 'proj-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  testSuite: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('SuitesService', () => {
  let service: SuitesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuitesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<SuitesService>(SuitesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns suites for the given project', async () => {
      prismaMock.testSuite.findMany.mockResolvedValue([mockSuite]);
      const result = await service.findAll('proj-1');
      expect(result).toEqual([mockSuite]);
      expect(prismaMock.testSuite.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns suite when found', async () => {
      prismaMock.testSuite.findFirst.mockResolvedValue(mockSuite);
      const result = await service.findOne('proj-1', 'suite-1');
      expect(result).toEqual(mockSuite);
    });

    it('throws NotFoundException when suite does not exist', async () => {
      prismaMock.testSuite.findFirst.mockResolvedValue(null);
      await expect(service.findOne('proj-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a suite scoped to the project', async () => {
      const dto = { name: 'Smoke Tests', description: undefined };
      prismaMock.testSuite.create.mockResolvedValue(mockSuite);
      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockSuite);
      expect(prismaMock.testSuite.create).toHaveBeenCalledWith({
        data: { ...dto, projectId: 'proj-1' },
      });
    });
  });
});
