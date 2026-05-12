import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RunsService } from './runs.service';
import { PrismaService } from '../../prisma/prisma.service';

const systemUser = { id: 'user-sys', email: 'system@testlab.local', name: 'System' };
const mockProject = {
  id: 'proj-1',
  name: 'Alpha',
  slug: 'alpha',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockRun = {
  id: 'run-1',
  name: 'Sprint 1',
  description: null,
  planId: null,
  assignedToId: null,
  status: 'ACTIVE',
  createdById: 'user-sys',
  createdAt: new Date(),
  updatedAt: new Date(),
  closedAt: null,
};

const prismaMock = {
  testRun: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('RunsService', () => {
  let service: RunsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RunsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<RunsService>(RunsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns runs for project', async () => {
      prismaMock.testRun.findMany.mockResolvedValue([mockRun]);
      const result = await service.findAll('proj-1');
      expect(result).toEqual([mockRun]);
    });
  });

  describe('findOne', () => {
    it('returns run when found', async () => {
      prismaMock.testRun.findFirst.mockResolvedValue(mockRun);
      const result = await service.findOne('proj-1', 'run-1');
      expect(result).toEqual(mockRun);
    });

    it('throws NotFoundException when run does not exist', async () => {
      prismaMock.testRun.findFirst.mockResolvedValue(null);
      await expect(service.findOne('proj-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { name: 'Sprint 1', description: undefined };

    it('creates run using existing system user', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject);
      prismaMock.user.findFirst.mockResolvedValue(systemUser);
      prismaMock.testRun.create.mockResolvedValue(mockRun);

      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockRun);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('creates system user when not found, then creates run', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject);
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(systemUser);
      prismaMock.testRun.create.mockResolvedValue(mockRun);

      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockRun);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { email: 'system@testlab.local', name: 'System' },
      });
    });

    it('throws NotFoundException when project does not exist', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await expect(service.create('bad-proj', dto as any)).rejects.toThrow(NotFoundException);
    });
  });
});
