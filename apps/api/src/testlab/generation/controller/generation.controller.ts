import { Controller, Post, Param, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { GenerationService } from '../service/generation.service';
import { GenerateDto } from './dto/generate.dto';
import { ConfirmGenerationDto } from './dto/confirm-generation.dto';

@ApiBearerAuth()
@ApiTags('generation')
@Controller('testlab/projects/:projectId/generate')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @ApiOperation({ summary: 'Generate test artifacts from a Jira issue (preview only)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'GenerationPreview' })
  @ApiResponse({ status: 422, description: 'Issue description is empty' })
  @Post()
  @HttpCode(HttpStatus.OK)
  async generate(@Param('projectId') projectId: string, @Body() dto: GenerateDto) {
    return this.generationService.generate(projectId, dto.issueKey);
  }

  @ApiOperation({ summary: 'Persist generated artifacts' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Created IDs' })
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @Param('projectId') projectId: string,
    @Body() dto: ConfirmGenerationDto,
    @Req() req: Request,
  ) {
    const userId: string = (req.user as any)?.sub ?? (req.user as any)?.id ?? 'system';
    return this.generationService.confirm(projectId, dto.suiteId, userId, {
      milestone: dto.milestone,
      requirements: dto.requirements,
      testCases: dto.testCases as any,
    });
  }
}
