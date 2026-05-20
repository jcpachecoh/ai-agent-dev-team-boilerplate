import { Injectable, NotFoundException } from '@nestjs/common';
import type { Requirement, TestCase } from '@prisma/client';
import { RequirementsRepository } from '../repository/requirements.repository';
import { CreateRequirementDto } from '../controller/dto/create-requirement.dto';
import type { IRequirementsService } from '../interfaces/requirements.interfaces';

@Injectable()
export class RequirementsService implements IRequirementsService {
  constructor(private readonly requirementsRepository: RequirementsRepository) {}

  findAll(projectId: string): Promise<Requirement[]> {
    return this.requirementsRepository.findAll(projectId);
  }

  async findOne(projectId: string, id: string): Promise<Requirement> {
    const req = await this.requirementsRepository.findOne(projectId, id);
    if (!req) throw new NotFoundException(`Requirement ${id} not found`);
    return req;
  }

  async create(projectId: string, dto: CreateRequirementDto): Promise<Requirement> {
    return this.requirementsRepository.create({ ...dto, projectId });
  }

  async findCases(projectId: string, id: string): Promise<TestCase[]> {
    await this.findOne(projectId, id);
    return this.requirementsRepository.findCases(projectId, id);
  }
}
