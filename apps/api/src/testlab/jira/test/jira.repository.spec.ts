import { Test, TestingModule } from '@nestjs/testing';
import { JiraEntityType } from '@prisma/client';
import { JiraRepository } from '../repository/jira.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const mockLink = {
  id: 'link-1',
  projectId: 'proj-1',
  issueKey: 'PROJ-1',
  entityType: JiraEntityType.testCase,
  entityId: 'case-1',
  issueSummary: 'Fix login',
  issueUrl: 'https://example.atlassian.net/browse/PROJ-1',
  createdAt: new Date(),
};

const prismaMock = {
  jiraLink: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
};

describe('JiraRepository', () => {
  let repository: JiraRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JiraRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<JiraRepository>(JiraRepository);
    jest.clearAllMocks();
  });

  describe('createLink', () => {
    it('creates a jira link via prisma', async () => {
      prismaMock.jiraLink.create.mockResolvedValue(mockLink);
      const input = {
        projectId: 'proj-1',
        issueKey: 'PROJ-1',
        entityType: JiraEntityType.testCase,
        entityId: 'case-1',
        issueSummary: 'Fix login',
        issueUrl: 'https://example.atlassian.net/browse/PROJ-1',
      };
      const result = await repository.createLink(input);
      expect(result).toEqual(mockLink);
      expect(prismaMock.jiraLink.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          issueKey: 'PROJ-1',
          entityType: JiraEntityType.testCase,
          entityId: 'case-1',
          issueSummary: 'Fix login',
          issueUrl: 'https://example.atlassian.net/browse/PROJ-1',
        },
      });
    });
  });

  describe('findLinksByProject', () => {
    it('returns links ordered by createdAt desc', async () => {
      prismaMock.jiraLink.findMany.mockResolvedValue([mockLink]);
      const result = await repository.findLinksByProject('proj-1');
      expect(result).toEqual([mockLink]);
      expect(prismaMock.jiraLink.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns empty array when no links exist', async () => {
      prismaMock.jiraLink.findMany.mockResolvedValue([]);
      const result = await repository.findLinksByProject('proj-1');
      expect(result).toEqual([]);
    });
  });

  describe('deleteLink', () => {
    it('deletes link by id', async () => {
      prismaMock.jiraLink.delete.mockResolvedValue(mockLink);
      await repository.deleteLink('link-1');
      expect(prismaMock.jiraLink.delete).toHaveBeenCalledWith({ where: { id: 'link-1' } });
    });
  });
});
