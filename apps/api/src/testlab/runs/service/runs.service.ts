import { Injectable, NotFoundException } from '@nestjs/common';
import type { TestRun } from '@prisma/client';
import { RunsRepository } from '../repository/runs.repository';
import { CreateRunDto } from '../controller/dto/create-run.dto';
import type { IRunsService } from '../interfaces/runs.interfaces';

@Injectable()
export class RunsService implements IRunsService {
  constructor(private readonly runsRepository: RunsRepository) {}

  findAll(projectId: string): Promise<TestRun[]> {
    return this.runsRepository.findAll(projectId);
  }

  async findOne(projectId: string, id: string): Promise<TestRun> {
    const run = await this.runsRepository.findOne(projectId, id);
    if (!run) throw new NotFoundException(`Run ${id} not found`);
    return run;
  }

  async create(projectId: string, dto: CreateRunDto): Promise<TestRun> {
    const project = await this.runsRepository.findProjectById(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    const systemUser = await this.runsRepository.findOrCreateSystemUser();
    return this.runsRepository.create({
      name: dto.name,
      description: dto.description,
      createdById: systemUser.id,
    });
  }
}
