import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SuitesService } from '../service/suites.service';
import { CreateSuiteDto } from './dto/create-suite.dto';
import type { TestSuite } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('suites')
@Controller('testlab/projects/:projectId/suites')
export class SuitesController {
  constructor(private readonly suitesService: SuitesService) {}

  @ApiOperation({ summary: 'List all test suites for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Array of test suites' })
  @Get()
  findAll(@Param('projectId') projectId: string): Promise<TestSuite[]> {
    return this.suitesService.findAll(projectId);
  }

  @ApiOperation({ summary: 'Get a test suite by ID' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Suite UUID' })
  @ApiResponse({ status: 200, description: 'Suite found' })
  @ApiResponse({ status: 404, description: 'Suite not found' })
  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string): Promise<TestSuite> {
    return this.suitesService.findOne(projectId, id);
  }

  @ApiOperation({ summary: 'Create a new test suite' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiCreatedResponse({ description: 'Suite created' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param('projectId') projectId: string, @Body() dto: CreateSuiteDto): Promise<TestSuite> {
    return this.suitesService.create(projectId, dto);
  }
}
