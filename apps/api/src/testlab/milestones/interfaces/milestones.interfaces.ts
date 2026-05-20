import type { Milestone, TestCase } from '@prisma/client';
import type { CreateMilestoneDto } from '../controller/dto/create-milestone.dto';

export interface CreateMilestoneData {
  name: string;
  description?: string;
  dueDate?: Date;
  projectId: string;
}

export interface IMilestonesRepository {
  findAll(projectId: string): Promise<Milestone[]>;
  findOne(projectId: string, id: string): Promise<Milestone | null>;
  create(data: CreateMilestoneData): Promise<Milestone>;
  findCases(projectId: string, id: string): Promise<TestCase[]>;
}

export interface IMilestonesService {
  findAll(projectId: string): Promise<Milestone[]>;
  findOne(projectId: string, id: string): Promise<Milestone>;
  create(projectId: string, dto: CreateMilestoneDto): Promise<Milestone>;
  findCases(projectId: string, id: string): Promise<TestCase[]>;
}
