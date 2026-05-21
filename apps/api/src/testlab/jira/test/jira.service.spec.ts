import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { JiraService, JIRA_CLIENT } from '../service/jira.service';
import { JiraRepository } from '../repository/jira.repository';
import { JiraEntityType } from '@prisma/client';

const jiraClientMock = {
  projects: { searchProjects: jest.fn() },
  issueSearch: { searchForIssuesUsingJql: jest.fn() },
  issues: { getIssue: jest.fn() },
};

const repoMock = {
  createLink: jest.fn(),
  findLinksByProject: jest.fn(),
  deleteLink: jest.fn(),
};

const mockRawIssue = {
  key: 'PROJ-1',
  fields: {
    summary: 'Fix login',
    description: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AC: user can login.' }] }],
    },
    priority: { name: 'High' },
    status: { name: 'In Progress' },
    labels: ['bug'],
    customfield_10016: 3,
  },
};

describe('JiraService', () => {
  let service: JiraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JiraService,
        { provide: JIRA_CLIENT, useValue: jiraClientMock },
        { provide: JiraRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get<JiraService>(JiraService);
    jest.clearAllMocks();
  });

  describe('getProjects', () => {
    it('returns mapped projects', async () => {
      jiraClientMock.projects.searchProjects.mockResolvedValue({
        values: [{ key: 'PROJ', name: 'Project', id: '10000' }],
      });
      const result = await service.getProjects();
      expect(result).toEqual([{ key: 'PROJ', name: 'Project', id: '10000' }]);
    });

    it('returns empty array when no values', async () => {
      jiraClientMock.projects.searchProjects.mockResolvedValue({});
      const result = await service.getProjects();
      expect(result).toEqual([]);
    });
  });

  describe('searchIssues', () => {
    it('uses default JQL when no query provided', async () => {
      jiraClientMock.issueSearch.searchForIssuesUsingJql.mockResolvedValue({ issues: [] });
      await service.searchIssues('PROJ');
      expect(jiraClientMock.issueSearch.searchForIssuesUsingJql).toHaveBeenCalledWith(
        expect.objectContaining({ jql: expect.stringContaining('ORDER BY updated DESC') }),
      );
    });

    it('includes text filter when query is provided', async () => {
      jiraClientMock.issueSearch.searchForIssuesUsingJql.mockResolvedValue({ issues: [] });
      await service.searchIssues('PROJ', 'login');
      expect(jiraClientMock.issueSearch.searchForIssuesUsingJql).toHaveBeenCalledWith(
        expect.objectContaining({ jql: expect.stringContaining('text ~ "login"') }),
      );
    });
  });

  describe('getIssue', () => {
    it('maps raw issue to JiraIssue shape', async () => {
      jiraClientMock.issues.getIssue.mockResolvedValue(mockRawIssue);
      const result = await service.getIssue('PROJ-1');
      expect(result.key).toBe('PROJ-1');
      expect(result.summary).toBe('Fix login');
      expect(result.description).toBe('AC: user can login.');
      expect(result.priority).toBe('High');
      expect(result.storyPoints).toBe(3);
    });

    it('throws NotFoundException when Jira returns error', async () => {
      jiraClientMock.issues.getIssue.mockRejectedValue(new Error('Not found'));
      await expect(service.getIssue('BAD-0')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLink', () => {
    it('fetches issue and delegates to repository', async () => {
      jiraClientMock.issues.getIssue.mockResolvedValue(mockRawIssue);
      repoMock.createLink.mockResolvedValue({ id: 'link-1' });
      const result = await service.createLink({
        projectId: 'proj-1',
        issueKey: 'PROJ-1',
        entityType: JiraEntityType.testCase,
        entityId: 'case-1',
      });
      expect(repoMock.createLink).toHaveBeenCalledWith(
        expect.objectContaining({ issueKey: 'PROJ-1', issueSummary: 'Fix login' }),
      );
      expect(result).toEqual({ id: 'link-1' });
    });
  });

  describe('findLinksByProject', () => {
    it('delegates to repository', async () => {
      repoMock.findLinksByProject.mockResolvedValue([{ id: 'link-1' }]);
      const result = await service.findLinksByProject('proj-1');
      expect(repoMock.findLinksByProject).toHaveBeenCalledWith('proj-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteLink', () => {
    it('delegates to repository', async () => {
      repoMock.deleteLink.mockResolvedValue(undefined);
      await service.deleteLink('link-1');
      expect(repoMock.deleteLink).toHaveBeenCalledWith('link-1');
    });
  });
});
