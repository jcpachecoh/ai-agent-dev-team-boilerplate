import { Test, TestingModule } from '@nestjs/testing';
import { RunsRepository } from '../repository/runs.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const prismaMock = {
  testRun: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  userTestLab: {
    upsert: jest.fn(),
  },
};

describe('RunsRepository', () => {
  let repository: RunsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RunsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<RunsRepository>(RunsRepository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('queries testRun.findMany filtered by plan.projectId', async () => {
      prismaMock.testRun.findMany.mockResolvedValue([]);
      await repository.findAll('proj-1');
      expect(prismaMock.testRun.findMany).toHaveBeenCalledWith({
        where: { plan: { projectId: 'proj-1' } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('queries testRun.findFirst with id and plan.projectId', async () => {
      prismaMock.testRun.findFirst.mockResolvedValue(null);
      await repository.findOne('proj-1', 'run-1');
      expect(prismaMock.testRun.findFirst).toHaveBeenCalledWith({
        where: { id: 'run-1', plan: { projectId: 'proj-1' } },
      });
    });
  });

  describe('create', () => {
    it('calls testRun.create with provided data', async () => {
      const data = { name: 'Sprint 1', createdById: 'u1' };
      prismaMock.testRun.create.mockResolvedValue({ id: 'run-1', ...data });
      await repository.create(data as any);
      expect(prismaMock.testRun.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('findProjectById', () => {
    it('queries project.findUnique and selects id', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 'proj-1' });
      const result = await repository.findProjectById('proj-1');
      expect(result).toEqual({ id: 'proj-1' });
      expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        select: { id: true },
      });
    });

    it('returns null when project does not exist', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      const result = await repository.findProjectById('bad');
      expect(result).toBeNull();
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
