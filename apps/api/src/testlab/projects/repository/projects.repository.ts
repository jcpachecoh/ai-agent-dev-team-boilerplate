import { Injectable } from '@nestjs/common';
import type { Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IProjectsRepository, CreateProjectData } from '../interfaces/projects.interfaces';

@Injectable()
export class ProjectsRepository implements IProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }

  findBySlug(slug: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { slug } });
  }

  create(data: CreateProjectData): Promise<Project> {
    return this.prisma.project.create({ data });
  }
}
