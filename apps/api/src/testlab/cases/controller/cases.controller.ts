import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CasesService } from '../service/cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';

@ApiTags('cases')
@Controller('testlab/projects/:projectId/suites/:suiteId/cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @ApiOperation({ summary: 'List all test cases in a suite' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'suiteId', description: 'Suite UUID' })
  @ApiResponse({ status: 200, description: 'Array of test cases' })
  @Get()
  findAll(@Param('suiteId') suiteId: string) {
    return this.casesService.findAll(suiteId);
  }

  @ApiOperation({ summary: 'Create a new test case' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'suiteId', description: 'Suite UUID' })
  @ApiCreatedResponse({ description: 'Test case created' })
  @Post()
  create(@Param('suiteId') suiteId: string, @Body() dto: CreateCaseDto) {
    return this.casesService.create(suiteId, dto);
  }

  @ApiOperation({ summary: 'Update the status of a test case' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'suiteId', description: 'Suite UUID' })
  @ApiParam({ name: 'id', description: 'Test case UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  @Patch(':id/status')
  updateStatus(
    @Param('suiteId') suiteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCaseStatusDto,
  ) {
    return this.casesService.updateStatus(suiteId, id, dto);
  }
}
