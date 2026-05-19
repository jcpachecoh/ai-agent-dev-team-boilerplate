import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RequirementsService } from '../service/requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import type { Requirement } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('requirements')
@Controller('testlab/projects/:projectId/requirements')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @ApiOperation({ summary: 'List all requirements for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Array of requirements' })
  @Get()
  findAll(@Param('projectId') projectId: string): Promise<Requirement[]> {
    return this.requirementsService.findAll(projectId);
  }

  @ApiOperation({ summary: 'Get a requirement by ID' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Requirement UUID' })
  @ApiResponse({ status: 200, description: 'Requirement found' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string): Promise<Requirement> {
    return this.requirementsService.findOne(projectId, id);
  }

  @ApiOperation({ summary: 'Create a new requirement' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiCreatedResponse({ description: 'Requirement created' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRequirementDto,
  ): Promise<Requirement> {
    return this.requirementsService.create(projectId, dto);
  }
}
