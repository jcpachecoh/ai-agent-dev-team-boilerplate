import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MilestonesService } from '../service/milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import type { Milestone } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('milestones')
@Controller('testlab/projects/:projectId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @ApiOperation({ summary: 'List all milestones for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Array of milestones' })
  @Get()
  findAll(@Param('projectId') projectId: string): Promise<Milestone[]> {
    return this.milestonesService.findAll(projectId);
  }

  @ApiOperation({ summary: 'Get a milestone by ID' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Milestone UUID' })
  @ApiResponse({ status: 200, description: 'Milestone found' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string): Promise<Milestone> {
    return this.milestonesService.findOne(projectId, id);
  }

  @ApiOperation({ summary: 'Create a new milestone' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiCreatedResponse({ description: 'Milestone created' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
  ): Promise<Milestone> {
    return this.milestonesService.create(projectId, dto);
  }
}
