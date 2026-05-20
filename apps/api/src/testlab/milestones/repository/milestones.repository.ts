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
        suite: {
          projectId,
          planEntries: {
            some: {
              plan: {
                projectId,
                milestoneId: id,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
