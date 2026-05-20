import { randomUUID } from 'crypto';

import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { MilestonesRepository } from '../repository/milestones.repository';

const prismaMock = {
  milestone: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  testCase: {
    findMany: jest.fn(),
  },
};

const integrationDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const isExplicitIntegrationRun = process.env.RUN_DB_INTEGRATION_TESTS === 'true';
const isSafeTestDatabase =
  typeof integrationDatabaseUrl === 'string' &&
  /(?:^|[/_-])test(?:$|[/_-])|localhost/i.test(integrationDatabaseUrl);
const describeIntegration =
  process.env.NODE_ENV === 'test' && isExplicitIntegrationRun && isSafeTestDatabase
    ? describe
    : describe.skip;

describe('MilestonesRepository', () => {
  let repository: MilestonesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MilestonesRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<MilestonesRepository>(MilestonesRepository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('queries milestone.findMany with projectId and dueDate asc order', async () => {
      prismaMock.milestone.findMany.mockResolvedValue([]);
      await repository.findAll('proj-1');
      expect(prismaMock.milestone.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { dueDate: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('queries milestone.findFirst with id and projectId', async () => {
      prismaMock.milestone.findFirst.mockResolvedValue(null);
      await repository.findOne('proj-1', 'ms-1');
      expect(prismaMock.milestone.findFirst).toHaveBeenCalledWith({
        where: { id: 'ms-1', projectId: 'proj-1' },
      });
    });
  });

  describe('create', () => {
    it('calls milestone.create with provided data', async () => {
      const data = { name: 'v1.0', projectId: 'proj-1', dueDate: new Date('2026-06-01') };
      prismaMock.milestone.create.mockResolvedValue({ id: 'ms-1', ...data });
      await repository.create(data as any);
      expect(prismaMock.milestone.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('findCases', () => {
    it('queries testCase.findMany for milestone-linked cases in project', async () => {
      prismaMock.testCase.findMany.mockResolvedValue([]);
      await repository.findCases('proj-1', 'ms-1');
      expect(prismaMock.testCase.findMany).toHaveBeenCalledWith({
        where: {
          suite: {
            projectId: 'proj-1',
            planEntries: {
              some: {
                plan: {
                  projectId: 'proj-1',
                  milestoneId: 'ms-1',
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});

describeIntegration('MilestonesRepository integration', () => {
  let prisma: PrismaService;
  let repository: MilestonesRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new MilestonesRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns only cases linked to the milestone through plan entries', async () => {
    const suffix = randomUUID();
    let userId: string | undefined;
    let projectId: string | undefined;
    let milestoneId: string | undefined;
    let otherMilestoneId: string | undefined;
    let suiteId: string | undefined;
    let otherSuiteId: string | undefined;
    let linkedCaseId: string | undefined;
    let unlinkedCaseId: string | undefined;
    let planId: string | undefined;
    let otherPlanId: string | undefined;

    try {
      const user = await prisma.user.create({
        data: { email: `milestones-${suffix}@example.com`, passwordHash: 'hash' },
      });
      userId = user.id;

      const project = await prisma.project.create({
        data: { name: `Milestone Project ${suffix}`, slug: `milestone-project-${suffix}` },
      });
      projectId = project.id;

      const [milestone, otherMilestone] = await Promise.all([
        prisma.milestone.create({ data: { name: `M1-${suffix}`, projectId: project.id } }),
        prisma.milestone.create({ data: { name: `M2-${suffix}`, projectId: project.id } }),
      ]);
      milestoneId = milestone.id;
      otherMilestoneId = otherMilestone.id;

      const [suite, otherSuite] = await Promise.all([
        prisma.testSuite.create({ data: { name: `Suite-${suffix}`, projectId: project.id } }),
        prisma.testSuite.create({ data: { name: `Other Suite-${suffix}`, projectId: project.id } }),
      ]);
      suiteId = suite.id;
      otherSuiteId = otherSuite.id;

      const [linkedCase, unlinkedCase] = await Promise.all([
        prisma.testCase.create({
          data: { title: `Linked case ${suffix}`, suiteId: suite.id, createdById: user.id },
        }),
        prisma.testCase.create({
          data: { title: `Unlinked case ${suffix}`, suiteId: otherSuite.id, createdById: user.id },
        }),
      ]);
      linkedCaseId = linkedCase.id;
      unlinkedCaseId = unlinkedCase.id;

      const [plan, otherPlan] = await Promise.all([
        prisma.testPlan.create({
          data: {
            name: `Plan-${suffix}`,
            projectId: project.id,
            milestoneId: milestone.id,
            createdById: user.id,
          },
        }),
        prisma.testPlan.create({
          data: {
            name: `Other Plan-${suffix}`,
            projectId: project.id,
            milestoneId: otherMilestone.id,
            createdById: user.id,
          },
        }),
      ]);
      planId = plan.id;
      otherPlanId = otherPlan.id;

      await prisma.testPlanEntry.create({ data: { planId: plan.id, suiteId: suite.id } });
      await prisma.testPlanEntry.create({ data: { planId: otherPlan.id, suiteId: otherSuite.id } });

      const cases = await repository.findCases(project.id, milestone.id);
      expect(cases.map(({ id }) => id)).toEqual([linkedCase.id]);
      expect(cases.find(({ id }) => id === unlinkedCase.id)).toBeUndefined();
    } finally {
      const planIds = [planId, otherPlanId].filter((id): id is string => typeof id === 'string');
      const testCaseIds = [linkedCaseId, unlinkedCaseId].filter(
        (id): id is string => typeof id === 'string',
      );
      const suiteIds = [suiteId, otherSuiteId].filter((id): id is string => typeof id === 'string');
      const milestoneIds = [milestoneId, otherMilestoneId].filter(
        (id): id is string => typeof id === 'string',
      );

      if (planIds.length > 0) {
        await prisma.testPlanEntry.deleteMany({ where: { planId: { in: planIds } } });
        await prisma.testPlan.deleteMany({ where: { id: { in: planIds } } });
      }

      if (testCaseIds.length > 0) {
        await prisma.testCase.deleteMany({ where: { id: { in: testCaseIds } } });
      }

      if (suiteIds.length > 0) {
        await prisma.testSuite.deleteMany({ where: { id: { in: suiteIds } } });
      }

      if (milestoneIds.length > 0) {
        await prisma.milestone.deleteMany({ where: { id: { in: milestoneIds } } });
      }

      if (projectId !== undefined) {
        await prisma.project.delete({ where: { id: projectId } });
      }

      if (userId !== undefined) {
        await prisma.user.delete({ where: { id: userId } });
      }
    }
  });
});
