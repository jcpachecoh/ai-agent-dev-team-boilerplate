import type { TestSuite } from '@prisma/client';
import type { CreateSuiteDto } from '../controller/dto/create-suite.dto';

export interface CreateSuiteData {
  name: string;
  description?: string;
  projectId: string;
}

export interface ISuitesRepository {
  findAll(projectId: string): Promise<TestSuite[]>;
  findOne(projectId: string, id: string): Promise<TestSuite | null>;
  create(data: CreateSuiteData): Promise<TestSuite>;
}

export interface ISuitesService {
  findAll(projectId: string): Promise<TestSuite[]>;
  findOne(projectId: string, id: string): Promise<TestSuite>;
  create(projectId: string, dto: CreateSuiteDto): Promise<TestSuite>;
}
