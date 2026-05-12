import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import type { Requirement } from '@prisma/client';

@Controller('testlab/projects/:projectId/requirements')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string): Promise<Requirement[]> {
    return this.requirementsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string): Promise<Requirement> {
    return this.requirementsService.findOne(projectId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRequirementDto,
  ): Promise<Requirement> {
    return this.requirementsService.create(projectId, dto);
  }
}
