import type { Project } from '@prisma/client';
import type { CreateProjectDto } from '../controller/dto/create-project.dto';

export interface CreateProjectData {
  name: string;
  slug: string;
  description?: string;
}

export interface IProjectsRepository {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  findBySlug(slug: string): Promise<Project | null>;
  create(data: CreateProjectData): Promise<Project>;
}

export interface IProjectsService {
  findAll(): Promise<Project[]>;
  findOne(id: string): Promise<Project>;
  create(dto: CreateProjectDto): Promise<Project>;
}
