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

    it('returns empty array when result has no issues field', async () => {
      jiraClientMock.issueSearch.searchForIssuesUsingJql.mockResolvedValue({});
      const result = await service.searchIssues('PROJ');
      expect(result).toEqual([]);
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

    it('throws ConflictException when repository throws P2002 error', async () => {
      jiraClientMock.issues.getIssue.mockResolvedValue(mockRawIssue);
      repoMock.createLink.mockRejectedValue({ code: 'P2002' });
      await expect(
        service.createLink({
          projectId: 'proj-1',
          issueKey: 'PROJ-1',
          entityType: JiraEntityType.testCase,
          entityId: 'case-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows non-P2002 errors from repository', async () => {
      jiraClientMock.issues.getIssue.mockResolvedValue(mockRawIssue);
      const unexpectedError = new Error('Database connection failed');
      repoMock.createLink.mockRejectedValue(unexpectedError);
      await expect(
        service.createLink({
          projectId: 'proj-1',
          issueKey: 'PROJ-1',
          entityType: JiraEntityType.testCase,
          entityId: 'case-1',
        }),
      ).rejects.toThrow('Database connection failed');
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

  describe('mapIssue field fallbacks', () => {
    it('uses Medium when priority is undefined', async () => {
      const raw = { ...mockRawIssue, fields: { ...mockRawIssue.fields, priority: undefined } };
      jiraClientMock.issues.getIssue.mockResolvedValue(raw);
      const result = await service.getIssue('PROJ-1');
      expect(result.priority).toBe('Medium');
    });

    it('uses Unknown when status is undefined', async () => {
      const raw = { ...mockRawIssue, fields: { ...mockRawIssue.fields, status: undefined } };
      jiraClientMock.issues.getIssue.mockResolvedValue(raw);
      const result = await service.getIssue('PROJ-1');
      expect(result.status).toBe('Unknown');
    });

    it('uses empty array when labels is not an array', async () => {
      const raw = { ...mockRawIssue, fields: { ...mockRawIssue.fields, labels: 'bug' } };
      jiraClientMock.issues.getIssue.mockResolvedValue(raw);
      const result = await service.getIssue('PROJ-1');
      expect(result.labels).toEqual([]);
    });

    it('uses story_points field when defined', async () => {
      const raw = {
        ...mockRawIssue,
        fields: { ...mockRawIssue.fields, story_points: 5, customfield_10016: undefined },
      };
      jiraClientMock.issues.getIssue.mockResolvedValue(raw);
      const result = await service.getIssue('PROJ-1');
      expect(result.storyPoints).toBe(5);
    });

    it('uses customfield_10016 when story_points is undefined', async () => {
      const raw = {
        ...mockRawIssue,
        fields: { ...mockRawIssue.fields, story_points: undefined, customfield_10016: 8 },
      };
      jiraClientMock.issues.getIssue.mockResolvedValue(raw);
      const result = await service.getIssue('PROJ-1');
      expect(result.storyPoints).toBe(8);
    });

    it('sets storyPoints to null when both fields are undefined', async () => {
      const raw = {
        ...mockRawIssue,
        fields: { ...mockRawIssue.fields, story_points: undefined, customfield_10016: undefined },
      };
      jiraClientMock.issues.getIssue.mockResolvedValue(raw);
      const result = await service.getIssue('PROJ-1');
      expect(result.storyPoints).toBeNull();
    });

    it('returns empty string for ADF node with no content and not text type', async () => {
      const raw = {
        ...mockRawIssue,
        fields: {
          ...mockRawIssue.fields,
          description: {
            type: 'doc',
            content: [{ type: 'hardBreak' }],
          },
        },
      };
      jiraClientMock.issues.getIssue.mockResolvedValue(raw);
      const result = await service.getIssue('PROJ-1');
      expect(result.description).toBe('');
    });
  });
});
