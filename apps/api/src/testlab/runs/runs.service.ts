import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRunDto } from './dto/create-run.dto';
import type { TestRun } from '@prisma/client';

@Injectable()
export class RunsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string): Promise<TestRun[]> {
    return this.prisma.testRun.findMany({
      where: { plan: { projectId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, id: string): Promise<TestRun> {
    const run = await this.prisma.testRun.findFirst({
      where: { id, plan: { projectId } },
    });
    if (!run) throw new NotFoundException(`Run ${id} not found`);
    return run;
  }

  async create(projectId: string, dto: CreateRunDto): Promise<TestRun> {
    // Create a standalone run (no plan) — createdById is a placeholder until auth is wired
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    // Find or create a system user for now
    let systemUser = await this.prisma.user.findFirst({ where: { email: 'system@testlab.local' } });
    if (!systemUser) {
      systemUser = await this.prisma.user.create({
        data: { email: 'system@testlab.local', name: 'System' },
      });
    }

    return this.prisma.testRun.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById: systemUser.id,
      },
    });
  }
}
