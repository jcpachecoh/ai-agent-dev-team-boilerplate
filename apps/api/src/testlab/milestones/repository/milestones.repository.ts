import { Injectable } from '@nestjs/common';
import type { Milestone, TestCase } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  IMilestonesRepository,
  CreateMilestoneData,
} from '../interfaces/milestones.interfaces';

@Injectable()
export class MilestonesRepository implements IMilestonesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(projectId: string): Promise<Milestone[]> {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
    });
  }

  findOne(projectId: string, id: string): Promise<Milestone | null> {
    return this.prisma.milestone.findFirst({ where: { id, projectId } });
  }

  create(data: CreateMilestoneData): Promise<Milestone> {
    return this.prisma.milestone.create({ data });
  }

  findCases(projectId: string, id: string): Promise<TestCase[]> {
    return this.prisma.testCase.findMany({
      where: {
        caseMilestones: { some: { milestoneId: id } },
        suite: { projectId },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async linkCase(milestoneId: string, caseId: string): Promise<void> {
    await this.prisma.caseMilestone.create({ data: { milestoneId, caseId } });
  }

  async unlinkCase(milestoneId: string, caseId: string): Promise<void> {
    await this.prisma.caseMilestone.delete({
      where: { milestoneId_caseId: { milestoneId, caseId } },
    });
  }
}
