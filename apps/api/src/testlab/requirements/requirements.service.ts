import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import type { Requirement } from '@prisma/client';

@Injectable()
export class RequirementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string): Promise<Requirement[]> {
    return this.prisma.requirement.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, id: string): Promise<Requirement> {
    const req = await this.prisma.requirement.findFirst({ where: { id, projectId } });
    if (!req) throw new NotFoundException(`Requirement ${id} not found`);
    return req;
  }

  async create(projectId: string, dto: CreateRequirementDto): Promise<Requirement> {
    return this.prisma.requirement.create({ data: { ...dto, projectId } });
  }
}
