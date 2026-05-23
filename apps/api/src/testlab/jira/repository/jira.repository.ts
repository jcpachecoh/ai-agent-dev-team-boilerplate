import { Injectable } from '@nestjs/common';
import type { JiraLink } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IJiraRepository, CreateLinkInput } from '../interfaces/jira.interfaces';

@Injectable()
export class JiraRepository implements IJiraRepository {
  constructor(private readonly prisma: PrismaService) {}

  createLink(
    input: CreateLinkInput & { issueSummary: string; issueUrl: string },
  ): Promise<JiraLink> {
    return this.prisma.jiraLink.create({
      data: {
        projectId: input.projectId,
        issueKey: input.issueKey,
        entityType: input.entityType,
        entityId: input.entityId,
        issueSummary: input.issueSummary,
        issueUrl: input.issueUrl,
      },
    });
  }

  findLinksByProject(projectId: string): Promise<JiraLink[]> {
    return this.prisma.jiraLink.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteLink(id: string): Promise<void> {
    await this.prisma.jiraLink.delete({ where: { id } });
  }
}
