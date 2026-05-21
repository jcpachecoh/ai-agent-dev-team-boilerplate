import { Injectable, ConflictException } from '@nestjs/common';
import type { JiraLink, JiraEntityType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IJiraRepository, CreateLinkInput } from '../interfaces/jira.interfaces';

@Injectable()
export class JiraRepository implements IJiraRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLink(
    input: CreateLinkInput & { issueSummary: string; issueUrl: string },
  ): Promise<JiraLink> {
    try {
      return await this.prisma.jiraLink.create({
        data: {
          projectId: input.projectId,
          issueKey: input.issueKey,
          entityType: input.entityType,
          entityId: input.entityId,
          issueSummary: input.issueSummary,
          issueUrl: input.issueUrl,
        },
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          `Jira link already exists for issue ${input.issueKey} on this entity.`,
        );
      }
      throw err;
    }
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
