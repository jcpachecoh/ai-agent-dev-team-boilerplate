import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SuitesService } from './suites.service';
import { CreateSuiteDto } from './dto/create-suite.dto';
import type { TestSuite } from '@prisma/client';

@Controller('testlab/projects/:projectId/suites')
export class SuitesController {
  constructor(private readonly suitesService: SuitesService) {}

  @Get()
  findAll(@Param('projectId') projectId: string): Promise<TestSuite[]> {
    return this.suitesService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string): Promise<TestSuite> {
    return this.suitesService.findOne(projectId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param('projectId') projectId: string, @Body() dto: CreateSuiteDto): Promise<TestSuite> {
    return this.suitesService.create(projectId, dto);
  }
}
