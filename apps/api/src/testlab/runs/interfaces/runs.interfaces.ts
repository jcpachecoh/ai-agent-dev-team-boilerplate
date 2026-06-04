import type { TestRun } from '@prisma/client';
import type { CreateRunDto } from '../controller/dto/create-run.dto';

export interface CreateRunData {
  name: string;
  description?: string;
  createdById: string;
}

export interface IRunsRepository {
  findAll(projectId: string): Promise<TestRun[]>;
  findOne(projectId: string, id: string): Promise<TestRun | null>;
  create(data: CreateRunData): Promise<TestRun>;
  findProjectById(id: string): Promise<{ id: string } | null>;
  findOrCreateSystemUser(): Promise<{ id: string }>;
}

export interface IRunsService {
  findAll(projectId: string): Promise<TestRun[]>;
  findOne(projectId: string, id: string): Promise<TestRun>;
  create(projectId: string, dto: CreateRunDto): Promise<TestRun>;
}
