import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';

@Controller('testlab/projects/:projectId/suites/:suiteId/cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  findAll(@Param('suiteId') suiteId: string) {
    return this.casesService.findAll(suiteId);
  }

  @Post()
  create(@Param('suiteId') suiteId: string, @Body() dto: CreateCaseDto) {
    return this.casesService.create(suiteId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('suiteId') suiteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCaseStatusDto,
  ) {
    return this.casesService.updateStatus(suiteId, id, dto);
  }
}
