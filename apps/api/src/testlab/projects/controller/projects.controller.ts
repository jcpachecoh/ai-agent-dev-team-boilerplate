import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ProjectsService } from '../service/projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import type { Project } from '@prisma/client';

@ApiTags('projects')
@Controller('testlab/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'List all projects' })
  @ApiResponse({ status: 200, description: 'Array of projects' })
  @Get()
  findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project found' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new project' })
  @ApiCreatedResponse({ description: 'Project created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(dto);
  }
}
