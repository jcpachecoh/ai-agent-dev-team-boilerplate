import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesService } from '../service/milestones.service';
import { MilestonesRepository } from '../repository/milestones.repository';

const mockMilestone = {
  id: 'ms-1',
  name: 'v1.0 Launch',
  description: null,
  dueDate: new Date('2026-06-01'),
  projectId: 'proj-1',
  completed: false,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findCases: jest.fn(),
  linkCase: jest.fn(),
  unlinkCase: jest.fn(),
};

const mockCase = {
  id: 'case-1',
  title: 'Checkout works',
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  status: 'UNTESTED',
  preconditions: null,
  expectedResult: null,
  sectionId: null,
  suiteId: 'suite-1',
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MilestonesService', () => {
  let service: MilestonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MilestonesService, { provide: MilestonesRepository, useValue: repoMock }],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns milestones for project', async () => {
      repoMock.findAll.mockResolvedValue([mockMilestone]);
      const result = await service.findAll('proj-1');
      expect(result).toEqual([mockMilestone]);
      expect(repoMock.findAll).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('findOne', () => {
    it('returns milestone when found', async () => {
      repoMock.findOne.mockResolvedValue(mockMilestone);
      const result = await service.findOne('proj-1', 'ms-1');
      expect(result).toEqual(mockMilestone);
    });

    it('throws NotFoundException when not found', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('proj-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates milestone with dueDate converted to Date', async () => {
      const dto = { name: 'v1.0 Launch', dueDate: '2026-06-01', description: undefined };
      repoMock.create.mockResolvedValue(mockMilestone);
      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockMilestone);
      expect(repoMock.create).toHaveBeenCalledWith({
        name: 'v1.0 Launch',
        description: undefined,
        dueDate: new Date('2026-06-01'),
        projectId: 'proj-1',
      });
    });

    it('creates milestone without dueDate when not provided', async () => {
      const dto = { name: 'v1.0 Launch', description: undefined };
      repoMock.create.mockResolvedValue({ ...mockMilestone, dueDate: null });
      const result = await service.create('proj-1', dto as any);
      expect(result.dueDate).toBeNull();
      expect(repoMock.create).toHaveBeenCalledWith(expect.objectContaining({ dueDate: undefined }));
    });
  });

  describe('findCases', () => {
    it('returns linked test cases when milestone exists', async () => {
      repoMock.findOne.mockResolvedValue(mockMilestone);
      repoMock.findCases.mockResolvedValue([mockCase]);
      const result = await service.findCases('proj-1', 'ms-1');
      expect(result).toEqual([mockCase]);
      expect(repoMock.findCases).toHaveBeenCalledWith('proj-1', 'ms-1');
    });

    it('throws NotFoundException when milestone does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.findCases('proj-1', 'missing')).rejects.toThrow(NotFoundException);
      expect(repoMock.findCases).not.toHaveBeenCalled();
    });
  });

  describe('linkCase', () => {
    it('links a case when milestone exists', async () => {
      repoMock.findOne.mockResolvedValue(mockMilestone);
      repoMock.linkCase.mockResolvedValue(undefined);
      await expect(service.linkCase('proj-1', 'ms-1', 'case-1')).resolves.toBeUndefined();
      expect(repoMock.linkCase).toHaveBeenCalledWith('ms-1', 'case-1');
    });

    it('throws NotFoundException when milestone does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.linkCase('proj-1', 'bad', 'case-1')).rejects.toThrow(NotFoundException);
      expect(repoMock.linkCase).not.toHaveBeenCalled();
    });

    it('throws ConflictException when link already exists (P2002)', async () => {
      const { Prisma } = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.x',
      });
      repoMock.findOne.mockResolvedValue(mockMilestone);
      repoMock.linkCase.mockRejectedValue(prismaError);
      await expect(service.linkCase('proj-1', 'ms-1', 'case-1')).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when test case not found (P2025)', async () => {
      const { Prisma } = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '5.x',
      });
      repoMock.findOne.mockResolvedValue(mockMilestone);
      repoMock.linkCase.mockRejectedValue(prismaError);
      await expect(service.linkCase('proj-1', 'ms-1', 'case-1')).rejects.toThrow(NotFoundException);
    });

    it('rethrows unknown errors from linkCase', async () => {
      repoMock.findOne.mockResolvedValue(mockMilestone);
      repoMock.linkCase.mockRejectedValue(new Error('Unexpected DB error'));
      await expect(service.linkCase('proj-1', 'ms-1', 'case-1')).rejects.toThrow(
        'Unexpected DB error',
      );
    });
  });

  describe('unlinkCase', () => {
    it('unlinks a case when milestone and link exist', async () => {
      repoMock.findOne.mockResolvedValue(mockMilestone);
      repoMock.unlinkCase.mockResolvedValue(undefined);
      await expect(service.unlinkCase('proj-1', 'ms-1', 'case-1')).resolves.toBeUndefined();
      expect(repoMock.unlinkCase).toHaveBeenCalledWith('ms-1', 'case-1');
    });

    it('throws NotFoundException when milestone does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.unlinkCase('proj-1', 'bad', 'case-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when link does not exist (P2025)', async () => {
      const { Prisma } = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '5.x',
      });
      repoMock.findOne.mockResolvedValue(mockMilestone);
      repoMock.unlinkCase.mockRejectedValue(prismaError);
      await expect(service.unlinkCase('proj-1', 'ms-1', 'case-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rethrows unknown errors from unlinkCase', async () => {
      repoMock.findOne.mockResolvedValue(mockMilestone);
      repoMock.unlinkCase.mockRejectedValue(new Error('Unexpected DB error'));
      await expect(service.unlinkCase('proj-1', 'ms-1', 'case-1')).rejects.toThrow(
        'Unexpected DB error',
      );
    });
  });
});
