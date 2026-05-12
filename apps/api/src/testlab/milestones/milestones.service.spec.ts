import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesService } from './milestones.service';
import { PrismaService } from '../../prisma/prisma.service';

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

const prismaMock = {
  milestone: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('MilestonesService', () => {
  let service: MilestonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MilestonesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns milestones for project ordered by dueDate asc', async () => {
      prismaMock.milestone.findMany.mockResolvedValue([mockMilestone]);
      const result = await service.findAll('proj-1');
      expect(result).toEqual([mockMilestone]);
      expect(prismaMock.milestone.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { dueDate: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns milestone when found', async () => {
      prismaMock.milestone.findFirst.mockResolvedValue(mockMilestone);
      const result = await service.findOne('proj-1', 'ms-1');
      expect(result).toEqual(mockMilestone);
    });

    it('throws NotFoundException when not found', async () => {
      prismaMock.milestone.findFirst.mockResolvedValue(null);
      await expect(service.findOne('proj-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates milestone with dueDate converted to Date', async () => {
      const dto = { name: 'v1.0 Launch', dueDate: '2026-06-01', description: undefined };
      prismaMock.milestone.create.mockResolvedValue(mockMilestone);
      const result = await service.create('proj-1', dto as any);
      expect(result).toEqual(mockMilestone);
      expect(prismaMock.milestone.create).toHaveBeenCalledWith({
        data: {
          name: 'v1.0 Launch',
          description: undefined,
          dueDate: new Date('2026-06-01'),
          projectId: 'proj-1',
        },
      });
    });

    it('creates milestone without dueDate when not provided', async () => {
      const dto = { name: 'v1.0 Launch', description: undefined };
      prismaMock.milestone.create.mockResolvedValue({ ...mockMilestone, dueDate: null });
      const result = await service.create('proj-1', dto as any);
      expect(result.dueDate).toBeNull();
      expect(prismaMock.milestone.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ dueDate: undefined }),
      });
    });
  });
});
