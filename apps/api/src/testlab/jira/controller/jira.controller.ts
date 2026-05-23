import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JiraService } from '../service/jira.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { SearchIssuesDto } from './dto/search-issues.dto';

@ApiTags('jira')
@Controller()
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  // ── Jira proxy endpoints ────────────────────────────────────────────────────

  @Get('testlab/jira/projects')
  @ApiOperation({ summary: 'List Jira projects accessible by the API token' })
  getProjects() {
    return this.jiraService.getProjects();
  }

  @Get('testlab/jira/issues')
  @ApiOperation({ summary: 'Search Jira issues by project key and optional JQL query' })
  searchIssues(@Query() dto: SearchIssuesDto) {
    return this.jiraService.searchIssues(dto.projectKey, dto.query, dto.limit);
  }

  @Get('testlab/jira/issues/:issueKey')
  @ApiOperation({ summary: 'Get a single Jira issue by key' })
  getIssue(@Param('issueKey') issueKey: string) {
    return this.jiraService.getIssue(issueKey);
  }

  // ── JiraLink CRUD ───────────────────────────────────────────────────────────

  @Post('testlab/projects/:projectId/jira-links')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link a Jira issue to a TestLab entity' })
  createLink(@Param('projectId') projectId: string, @Body() dto: CreateLinkDto) {
    return this.jiraService.createLink({
      projectId,
      issueKey: dto.issueKey,
      entityType: dto.entityType,
      entityId: dto.entityId,
    });
  }

  @Get('testlab/projects/:projectId/jira-links')
  @ApiOperation({ summary: 'List all Jira links for a project' })
  findLinks(@Param('projectId') projectId: string) {
    return this.jiraService.findLinksByProject(projectId);
  }

  @Delete('testlab/projects/:projectId/jira-links/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a Jira link' })
  deleteLink(@Param('id') id: string): Promise<void> {
    return this.jiraService.deleteLink(id);
  }
}
