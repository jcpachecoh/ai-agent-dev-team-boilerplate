import { Test, TestingModule } from '@nestjs/testing';
import { GenerationRepository } from '../repository/generation.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPreview = {
  milestone: { name: 'Sprint 1', description: 'Sprint 1 milestone', dueDate: '2026-06-01' },
  requirements: [{ title: 'User login', description: 'Must work', externalId: 'PROJ-1' }],
  testCases: [
    {
      title: 'Login with valid credentials',
      preconditions: 'User exists',
      steps: '1. Open login',
      expectedResult: 'User logged in',
      priority: 'HIGH',
      type: 'ACCEPTANCE',
    },
  ],
};

const mockConfirmResult = {
  milestoneId: 'ms-1',
  requirementIds: ['req-1'],
  testCaseIds: ['tc-1'],
};

const txMock = {
  milestone: { create: jest.fn() },
  requirement: { create: jest.fn() },
  testCase: { create: jest.fn() },
  caseMilestone: { create: jest.fn() },
  requirementCase: { create: jest.fn() },
};

const prismaMock = {
  $transaction: jest.fn(),
};

describe('GenerationRepository', () => {
  let repository: GenerationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerationRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<GenerationRepository>(GenerationRepository);
    jest.clearAllMocks();
  });

  describe('confirmGeneration', () => {
    it('runs a transaction and returns ids of created entities', async () => {
      prismaMock.$transaction.mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) => {
        txMock.milestone.create.mockResolvedValue({ id: 'ms-1' });
        txMock.requirement.create.mockResolvedValue({ id: 'req-1' });
        txMock.testCase.create.mockResolvedValue({ id: 'tc-1' });
        txMock.caseMilestone.create.mockResolvedValue({});
        return fn(txMock);
      });

      const result = await repository.confirmGeneration({
        projectId: 'proj-1',
        suiteId: 'suite-1',
        createdById: 'user-1',
        preview: mockPreview as any,
      });

      expect(result.milestoneId).toBe('ms-1');
      expect(result.requirementIds).toEqual(['req-1']);
      expect(result.testCaseIds).toEqual(['tc-1']);
    });

    it('skips milestone creation when preview has no milestone', async () => {
      prismaMock.$transaction.mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) => {
        txMock.requirement.create.mockResolvedValue({ id: 'req-1' });
        txMock.testCase.create.mockResolvedValue({ id: 'tc-1' });
        return fn(txMock);
      });

      const previewWithoutMilestone = { ...mockPreview, milestone: undefined };

      const result = await repository.confirmGeneration({
        projectId: 'proj-1',
        suiteId: 'suite-1',
        createdById: 'user-1',
        preview: previewWithoutMilestone as any,
      });

      expect(txMock.milestone.create).not.toHaveBeenCalled();
      expect(result.milestoneId).toBeUndefined();
    });

    it('skips caseMilestone when no milestoneId exists', async () => {
      prismaMock.$transaction.mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) => {
        txMock.requirement.create.mockResolvedValue({ id: 'req-1' });
        txMock.testCase.create.mockResolvedValue({ id: 'tc-1' });
        return fn(txMock);
      });

      const previewNoMilestone = {
        milestone: undefined,
        requirements: mockPreview.requirements,
        testCases: mockPreview.testCases,
      };

      await repository.confirmGeneration({
        projectId: 'proj-1',
        suiteId: 'suite-1',
        createdById: 'user-1',
        preview: previewNoMilestone as any,
      });

      expect(txMock.caseMilestone.create).not.toHaveBeenCalled();
    });
  });
});
