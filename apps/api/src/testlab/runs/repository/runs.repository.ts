import { Injectable } from '@nestjs/common';
import type { TestRun } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IRunsRepository, CreateRunData } from '../interfaces/runs.interfaces';

@Injectable()
export class RunsRepository implements IRunsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(projectId: string): Promise<TestRun[]> {
    return this.prisma.testRun.findMany({
      where: { plan: { projectId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(projectId: string, id: string): Promise<TestRun | null> {
    return this.prisma.testRun.findFirst({
      where: { id, plan: { projectId } },
    });
  }

  create(data: CreateRunData): Promise<TestRun> {
    return this.prisma.testRun.create({ data });
  }

  findProjectById(id: string): Promise<{ id: string } | null> {
    return this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findOrCreateSystemUser(): Promise<{ id: string }> {
    return this.prisma.userTestLab.upsert({
      where: { email: 'system@testlab.local' },
      update: {},
      create: { email: 'system@testlab.local', name: 'System', passwordHash: '' },
      select: { id: true },
    });
  }
}
