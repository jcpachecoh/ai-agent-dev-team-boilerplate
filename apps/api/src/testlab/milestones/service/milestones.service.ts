import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Milestone, TestCase } from '@prisma/client';
import { MilestonesRepository } from '../repository/milestones.repository';
import { CreateMilestoneDto } from '../controller/dto/create-milestone.dto';
import type { IMilestonesService } from '../interfaces/milestones.interfaces';

@Injectable()
export class MilestonesService implements IMilestonesService {
  constructor(private readonly milestonesRepository: MilestonesRepository) {}

  findAll(projectId: string): Promise<Milestone[]> {
    return this.milestonesRepository.findAll(projectId);
  }

  async findOne(projectId: string, id: string): Promise<Milestone> {
    const milestone = await this.milestonesRepository.findOne(projectId, id);
    if (!milestone) throw new NotFoundException(`Milestone ${id} not found`);
    return milestone;
  }

  async create(projectId: string, dto: CreateMilestoneDto): Promise<Milestone> {
    return this.milestonesRepository.create({
      name: dto.name,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      projectId,
    });
  }

  async findCases(projectId: string, id: string): Promise<TestCase[]> {
    await this.findOne(projectId, id);
    return this.milestonesRepository.findCases(projectId, id);
  }

  async linkCase(projectId: string, id: string, caseId: string): Promise<void> {
    await this.findOne(projectId, id);
    try {
      await this.milestonesRepository.linkCase(id, caseId);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Test case is already linked to this milestone');
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Test case not found');
      }
      throw e;
    }
  }

  async unlinkCase(projectId: string, id: string, caseId: string): Promise<void> {
    await this.findOne(projectId, id);
    try {
      await this.milestonesRepository.unlinkCase(id, caseId);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Link not found');
      }
      throw e;
    }
  }
}
