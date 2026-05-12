import { Injectable, NotFoundException } from '@nestjs/common';
import type { TestSuite } from '@prisma/client';
import { SuitesRepository } from '../repository/suites.repository';
import { CreateSuiteDto } from '../controller/dto/create-suite.dto';
import type { ISuitesService } from '../interfaces/suites.interfaces';

@Injectable()
export class SuitesService implements ISuitesService {
  constructor(private readonly suitesRepository: SuitesRepository) {}

  findAll(projectId: string): Promise<TestSuite[]> {
    return this.suitesRepository.findAll(projectId);
  }

  async findOne(projectId: string, id: string): Promise<TestSuite> {
    const suite = await this.suitesRepository.findOne(projectId, id);
    if (!suite) throw new NotFoundException(`Suite ${id} not found`);
    return suite;
  }

  async create(projectId: string, dto: CreateSuiteDto): Promise<TestSuite> {
    return this.suitesRepository.create({ ...dto, projectId });
  }
}
