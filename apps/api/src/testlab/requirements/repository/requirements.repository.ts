import { Injectable } from '@nestjs/common';
import type { Requirement } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  IRequirementsRepository,
  CreateRequirementData,
} from '../interfaces/requirements.interfaces';

@Injectable()
export class RequirementsRepository implements IRequirementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(projectId: string): Promise<Requirement[]> {
    return this.prisma.requirement.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(projectId: string, id: string): Promise<Requirement | null> {
    return this.prisma.requirement.findFirst({ where: { id, projectId } });
  }

  create(data: CreateRequirementData): Promise<Requirement> {
    return this.prisma.requirement.create({ data });
  }
}
