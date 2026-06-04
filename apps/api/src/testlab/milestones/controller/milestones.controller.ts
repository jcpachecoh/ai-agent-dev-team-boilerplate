import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MilestonesService } from '../service/milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { LinkCaseDto } from './dto/link-case.dto';
import type { Milestone, TestCase } from '@prisma/client';

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

  @ApiOperation({ summary: 'List test cases linked to a milestone' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Milestone UUID' })
  @ApiResponse({ status: 200, description: 'Array of linked test cases' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  @Get(':id/cases')
  findCases(@Param('projectId') projectId: string, @Param('id') id: string): Promise<TestCase[]> {
    return this.milestonesService.findCases(projectId, id);
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

  @ApiOperation({ summary: 'Link a test case to a milestone' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Milestone UUID' })
  @ApiCreatedResponse({ description: 'Link created' })
  @ApiResponse({ status: 404, description: 'Milestone or case not found' })
  @ApiResponse({ status: 409, description: 'Link already exists' })
  @Post(':id/cases')
  @HttpCode(HttpStatus.CREATED)
  async linkCase(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: LinkCaseDto,
  ): Promise<void> {
    return this.milestonesService.linkCase(projectId, id, dto.caseId);
  }

  @ApiOperation({ summary: 'Unlink a test case from a milestone' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Milestone UUID' })
  @ApiParam({ name: 'caseId', description: 'Test Case UUID' })
  @ApiNoContentResponse({ description: 'Link removed' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Delete(':id/cases/:caseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkCase(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Param('caseId') caseId: string,
  ): Promise<void> {
    return this.milestonesService.unlinkCase(projectId, id, caseId);
  }
}
