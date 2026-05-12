import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RunsService } from './runs.service';
import { CreateRunDto } from './dto/create-run.dto';
import type { TestRun } from '@prisma/client';

@Controller('testlab/projects/:projectId/runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string): Promise<TestRun[]> {
    return this.runsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string): Promise<TestRun> {
    return this.runsService.findOne(projectId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param('projectId') projectId: string, @Body() dto: CreateRunDto): Promise<TestRun> {
    return this.runsService.create(projectId, dto);
  }
}
