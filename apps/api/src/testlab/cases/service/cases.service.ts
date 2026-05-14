import { Injectable, NotFoundException } from '@nestjs/common';
import type { TestCase, CasePriority, CaseType, ResultStatus } from '@prisma/client';
import { CasesRepository } from '../repository/cases.repository';
import { CreateCaseDto } from '../controller/dto/create-case.dto';
import { UpdateCaseStatusDto } from '../controller/dto/update-case-status.dto';
import type { ICasesService } from '../interfaces/cases.interfaces';

@Injectable()
export class CasesService implements ICasesService {
  constructor(private readonly casesRepository: CasesRepository) {}

  findAll(suiteId: string): Promise<TestCase[]> {
    return this.casesRepository.findAll(suiteId);
  }

  async findOne(suiteId: string, id: string): Promise<TestCase> {
    const tc = await this.casesRepository.findOne(suiteId, id);
    if (!tc) throw new NotFoundException('Test case not found');
    return tc;
  }

  async create(suiteId: string, dto: CreateCaseDto): Promise<TestCase> {
    const systemUser = await this.casesRepository.findOrCreateSystemUser();
    return this.casesRepository.create({
      title: dto.title,
      priority: (dto.priority ?? 'MEDIUM') as CasePriority,
      type: (dto.type ?? 'FUNCTIONAL') as CaseType,
      preconditions: dto.preconditions,
      expectedResult: dto.expectedResult,
      suiteId,
      createdById: systemUser.id,
    });
  }

  async updateStatus(suiteId: string, id: string, dto: UpdateCaseStatusDto): Promise<TestCase> {
    await this.findOne(suiteId, id);
    return this.casesRepository.updateStatus(id, dto.status as ResultStatus);
  }
}
