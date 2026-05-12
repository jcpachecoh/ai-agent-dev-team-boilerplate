import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import type { Milestone } from '@prisma/client';

@Controller('testlab/projects/:projectId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  findAll(@Param('projectId') projectId: string): Promise<Milestone[]> {
    return this.milestonesService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string): Promise<Milestone> {
    return this.milestonesService.findOne(projectId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
  ): Promise<Milestone> {
    return this.milestonesService.create(projectId, dto);
  }
}
