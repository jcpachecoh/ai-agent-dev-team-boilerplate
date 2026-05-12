import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import type { Project } from '@prisma/client';
import { ProjectsRepository } from '../repository/projects.repository';
import { CreateProjectDto } from '../controller/dto/create-project.dto';
import type { IProjectsService } from '../interfaces/projects.interfaces';

@Injectable()
export class ProjectsService implements IProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  findAll(): Promise<Project[]> {
    return this.projectsRepository.findAll();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findById(id);
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const existing = await this.projectsRepository.findBySlug(dto.slug);
    if (existing) throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    return this.projectsRepository.create(dto);
  }
}
