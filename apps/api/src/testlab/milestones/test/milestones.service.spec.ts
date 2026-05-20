import { NotFoundException } from '@nestjs/common';
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
});
