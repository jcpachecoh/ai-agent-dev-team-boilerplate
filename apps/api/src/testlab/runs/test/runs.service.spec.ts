import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RunsService } from '../service/runs.service';
import { RunsRepository } from '../repository/runs.repository';

const systemUser = { id: 'user-sys' };
const mockProject = { id: 'proj-1' };
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

const repoMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findProjectById: jest.fn(),
  findOrCreateSystemUser: jest.fn(),
};

describe('RunsService', () => {
  let service: RunsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RunsService, { provide: RunsRepository, useValue: repoMock }],
    }).compile();

    service = module.get<RunsService>(RunsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns runs for project', async () => {
      repoMock.findAll.mockResolvedValue([mockRun]);
      const result = await service.findAll('proj-1');
      expect(result).toEqual([mockRun]);
      expect(repoMock.findAll).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('findOne', () => {
    it('returns run when found', async () => {
      repoMock.findOne.mockResolvedValue(mockRun);
      const result = await service.findOne('proj-1', 'run-1');
      expect(result).toEqual(mockRun);
    });

    it('throws NotFoundException when run does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('proj-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { name: 'Sprint 1', description: undefined };

    it('creates run with system user', async () => {
      repoMock.findProjectById.mockResolvedValue(mockProject);
      repoMock.findOrCreateSystemUser.mockResolvedValue(systemUser);
      repoMock.create.mockResolvedValue(mockRun);

      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockRun);
      expect(repoMock.create).toHaveBeenCalledWith({
        name: 'Sprint 1',
        description: undefined,
        createdById: 'user-sys',
      });
    });

    it('throws NotFoundException when project does not exist', async () => {
      repoMock.findProjectById.mockResolvedValue(null);
      await expect(service.create('bad-proj', dto as any)).rejects.toThrow(NotFoundException);
    });
  });
});
