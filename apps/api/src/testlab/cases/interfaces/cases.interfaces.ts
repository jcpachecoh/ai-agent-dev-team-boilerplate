import type { TestCase, ResultStatus, CasePriority, CaseType } from '@prisma/client';
import type { CreateCaseDto } from '../controller/dto/create-case.dto';
import type { UpdateCaseStatusDto } from '../controller/dto/update-case-status.dto';

export interface CreateCaseData {
  title: string;
  priority: CasePriority;
  type: CaseType;
  preconditions?: string;
  expectedResult?: string;
  suiteId: string;
  createdById: string;
}

export interface ICasesRepository {
  findAll(suiteId: string): Promise<TestCase[]>;
  findOne(suiteId: string, id: string): Promise<TestCase | null>;
  create(data: CreateCaseData): Promise<TestCase>;
  updateStatus(id: string, status: ResultStatus): Promise<TestCase>;
  findOrCreateSystemUser(): Promise<{ id: string }>;
}

export interface ICasesService {
  findAll(suiteId: string): Promise<TestCase[]>;
  findOne(suiteId: string, id: string): Promise<TestCase>;
  create(suiteId: string, dto: CreateCaseDto): Promise<TestCase>;
  updateStatus(suiteId: string, id: string, dto: UpdateCaseStatusDto): Promise<TestCase>;
}
