import { Injectable, NotFoundException } from '@nestjs/common';
import type { Milestone } from '@prisma/client';
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
}
