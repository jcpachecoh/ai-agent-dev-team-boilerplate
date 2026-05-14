import type { Requirement } from '@prisma/client';
import type { CreateRequirementDto } from '../controller/dto/create-requirement.dto';

export interface CreateRequirementData {
  title: string;
  externalId?: string;
  description?: string;
  projectId: string;
}

export interface IRequirementsRepository {
  findAll(projectId: string): Promise<Requirement[]>;
  findOne(projectId: string, id: string): Promise<Requirement | null>;
  create(data: CreateRequirementData): Promise<Requirement>;
}

export interface IRequirementsService {
  findAll(projectId: string): Promise<Requirement[]>;
  findOne(projectId: string, id: string): Promise<Requirement>;
  create(projectId: string, dto: CreateRequirementDto): Promise<Requirement>;
}
