import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { GenerationService, JIRA_CLIENT } from '../service/generation.service';
import { GenerationRepository } from '../repository/generation.repository';

jest.mock('ai', () => ({
  generateObject: jest.fn(),
}));
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => 'mock-model'),
}));

const { generateObject } = require('ai') as { generateObject: jest.Mock };

const jiraClientMock = {
  issues: {
    getIssue: jest.fn(),
  },
};

const repoMock = {
  confirmGeneration: jest.fn(),
};

const mockJiraRaw = {
  key: 'PROJ-1',
  fields: {
    summary: 'Fix login bug',
    description: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'AC: User can log in with correct credentials.' }],
        },
      ],
    },
    priority: { name: 'High' },
    labels: ['bug'],
  },
};

const mockPreview = {
  milestone: { name: 'Sprint 1', description: 'Sprint milestone' },
  requirements: [{ title: 'User login', description: 'Must work', externalId: 'PROJ-1' }],
  testCases: [
    {
      title: 'Login with valid credentials',
      preconditions: 'User exists',
      steps: '1. Open login\n2. Enter credentials\n3. Submit',
      expectedResult: 'User logged in',
      priority: 'HIGH',
      type: 'ACCEPTANCE',
    },
  ],
};

describe('GenerationService', () => {
  let service: GenerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationService,
        { provide: JIRA_CLIENT, useValue: jiraClientMock },
        { provide: GenerationRepository, useValue: repoMock },
      ],
    }).compile();
    service = module.get<GenerationService>(GenerationService);
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('fetches Jira issue and calls generateObject, returns preview', async () => {
      jiraClientMock.issues.getIssue.mockResolvedValue(mockJiraRaw);
      generateObject.mockResolvedValue({ object: mockPreview });
      const result = await service.generate('proj-1', 'PROJ-1');
      expect(jiraClientMock.issues.getIssue).toHaveBeenCalledWith({ issueIdOrKey: 'PROJ-1' });
      expect(generateObject).toHaveBeenCalled();
      expect(result).toEqual(mockPreview);
    });

    it('throws UnprocessableEntityException when description is empty', async () => {
      const emptyRaw = { ...mockJiraRaw, fields: { ...mockJiraRaw.fields, description: null } };
      jiraClientMock.issues.getIssue.mockResolvedValue(emptyRaw);
      await expect(service.generate('proj-1', 'PROJ-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(generateObject).not.toHaveBeenCalled();
    });

    it('handles ADF nodes with no content and no text (e.g. hardBreak)', async () => {
      const rawWithHardBreak = {
        ...mockJiraRaw,
        fields: {
          ...mockJiraRaw.fields,
          description: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Hello' }, { type: 'hardBreak' }],
              },
            ],
          },
        },
      };
      jiraClientMock.issues.getIssue.mockResolvedValue(rawWithHardBreak);
      generateObject.mockResolvedValue({ object: mockPreview });
      const result = await service.generate('proj-1', 'PROJ-1');
      expect(generateObject).toHaveBeenCalled();
      expect(result).toEqual(mockPreview);
    });
  });

  describe('confirm', () => {
    it('delegates to repository', async () => {
      const result = { milestoneId: 'ms-1', requirementIds: ['req-1'], testCaseIds: ['tc-1'] };
      repoMock.confirmGeneration.mockResolvedValue(result);
      const out = await service.confirm('proj-1', 'suite-1', 'user-1', mockPreview as any);
      expect(out).toEqual(result);
      expect(repoMock.confirmGeneration).toHaveBeenCalledWith({
        projectId: 'proj-1',
        suiteId: 'suite-1',
        createdById: 'user-1',
        preview: mockPreview,
      });
    });
  });
});
