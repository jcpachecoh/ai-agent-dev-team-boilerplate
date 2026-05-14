import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RunsService } from '../service/runs.service';
import { CreateRunDto } from './dto/create-run.dto';
import type { TestRun } from '@prisma/client';

@ApiTags('runs')
@Controller('testlab/projects/:projectId/runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @ApiOperation({ summary: 'List all test runs for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Array of test runs' })
  @Get()
  findAll(@Param('projectId') projectId: string): Promise<TestRun[]> {
    return this.runsService.findAll(projectId);
  }

  @ApiOperation({ summary: 'Get a test run by ID' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Test run UUID' })
  @ApiResponse({ status: 200, description: 'Test run found' })
  @ApiResponse({ status: 404, description: 'Test run not found' })
  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string): Promise<TestRun> {
    return this.runsService.findOne(projectId, id);
  }

  @ApiOperation({ summary: 'Create a new test run' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiCreatedResponse({ description: 'Test run created' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param('projectId') projectId: string, @Body() dto: CreateRunDto): Promise<TestRun> {
    return this.runsService.create(projectId, dto);
  }
}
