import { Test, TestingModule } from '@nestjs/testing';
import { JiraController } from '../controller/jira.controller';
import { JiraService } from '../service/jira.service';
import { JiraEntityType } from '@prisma/client';

const serviceMock = {
  getProjects: jest.fn(),
  searchIssues: jest.fn(),
  getIssue: jest.fn(),
  createLink: jest.fn(),
  findLinksByProject: jest.fn(),
  deleteLink: jest.fn(),
};

describe('JiraController', () => {
  let controller: JiraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JiraController],
      providers: [{ provide: JiraService, useValue: serviceMock }],
    }).compile();

    controller = module.get<JiraController>(JiraController);
    jest.clearAllMocks();
  });

  it('getProjects delegates to service', async () => {
    serviceMock.getProjects.mockResolvedValue([{ key: 'PROJ', name: 'Project', id: '1' }]);
    const result = await controller.getProjects();
    expect(serviceMock.getProjects).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('searchIssues delegates to service with dto fields', async () => {
    serviceMock.searchIssues.mockResolvedValue([]);
    await controller.searchIssues({ projectKey: 'PROJ', query: 'login', limit: 10 });
    expect(serviceMock.searchIssues).toHaveBeenCalledWith('PROJ', 'login', 10);
  });

  it('getIssue delegates to service', async () => {
    serviceMock.getIssue.mockResolvedValue({ key: 'PROJ-1' });
    const result = await controller.getIssue('PROJ-1');
    expect(serviceMock.getIssue).toHaveBeenCalledWith('PROJ-1');
    expect(result).toEqual({ key: 'PROJ-1' });
  });

  it('createLink delegates to service with projectId and dto fields', async () => {
    serviceMock.createLink.mockResolvedValue({ id: 'link-1' });
    await controller.createLink('proj-1', {
      issueKey: 'PROJ-1',
      entityType: JiraEntityType.testCase,
      entityId: 'case-1',
    });
    expect(serviceMock.createLink).toHaveBeenCalledWith({
      projectId: 'proj-1',
      issueKey: 'PROJ-1',
      entityType: JiraEntityType.testCase,
      entityId: 'case-1',
    });
  });

  it('findLinks delegates to service', async () => {
    serviceMock.findLinksByProject.mockResolvedValue([{ id: 'link-1' }]);
    const result = await controller.findLinks('proj-1');
    expect(serviceMock.findLinksByProject).toHaveBeenCalledWith('proj-1');
    expect(result).toHaveLength(1);
  });

  it('deleteLink delegates to service and returns void', async () => {
    serviceMock.deleteLink.mockResolvedValue(undefined);
    await controller.deleteLink('link-1');
    expect(serviceMock.deleteLink).toHaveBeenCalledWith('link-1');
  });
});
