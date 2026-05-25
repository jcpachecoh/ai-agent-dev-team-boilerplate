import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Version3Client } from 'jira.js';
import type { JiraLink } from '@prisma/client';
import { JiraRepository } from '../repository/jira.repository';
import type {
  IJiraService,
  JiraProject,
  JiraIssue,
  CreateLinkInput,
} from '../interfaces/jira.interfaces';

export const JIRA_CLIENT = 'JIRA_CLIENT';

@Injectable()
export class JiraService implements IJiraService {
  constructor(
    @Inject(JIRA_CLIENT) private readonly jira: Version3Client,
    private readonly jiraRepository: JiraRepository,
  ) {}

  async getProjects(): Promise<JiraProject[]> {
    const result = await this.jira.projects.searchProjects({ maxResults: 50 });
    return (result.values ?? []).map((p) => ({
      key: p.key,
      name: p.name,
      id: p.id,
    }));
  }

  async searchIssues(projectKey: string, query?: string, limit = 25): Promise<JiraIssue[]> {
    const jql = query
      ? `project = "${projectKey}" AND text ~ "${query}" ORDER BY updated DESC`
      : `project = "${projectKey}" ORDER BY updated DESC`;

    const result = await this.jira.issueSearch.searchForIssuesUsingJql({
      jql,
      maxResults: limit,
      fields: [
        'summary',
        'description',
        'priority',
        'status',
        'labels',
        'story_points',
        'customfield_10016',
      ],
    });

    return (result.issues ?? []).map((issue) => this.mapIssue(issue));
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    const issue = await this.jira.issues.getIssue({ issueIdOrKey: issueKey }).catch(() => {
      throw new NotFoundException(`Jira issue ${issueKey} not found.`);
    });
    return this.mapIssue(issue);
  }

  async createLink(input: CreateLinkInput): Promise<JiraLink> {
    const issue = await this.getIssue(input.issueKey);
    try {
      return await this.jiraRepository.createLink({
        ...input,
        issueSummary: issue.summary,
        issueUrl: issue.url,
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
    return this.jiraRepository.findLinksByProject(projectId);
  }

  deleteLink(id: string): Promise<void> {
    return this.jiraRepository.deleteLink(id);
  }

  // ── private helpers ─────────────────────────────────────────────────────────

  private mapIssue(issue: {
    key: string;
    fields: Record<string, unknown>;
    self?: string;
  }): JiraIssue {
    const fields = issue.fields;
    const description = extractAdfText(fields.description);
    const priority = (fields.priority as { name?: string } | undefined)?.name ?? 'Medium';
    const status = (fields.status as { name?: string } | undefined)?.name ?? 'Unknown';
    const labels = Array.isArray(fields.labels) ? (fields.labels as string[]) : [];
    const storyPoints =
      (fields.story_points as number | undefined) ??
      (fields.customfield_10016 as number | undefined) ??
      null;

    const host = process.env.JIRA_URL ?? '';
    const url = `${host}/browse/${issue.key}`;

    return {
      key: issue.key,
      summary: String(fields.summary ?? ''),
      description,
      priority,
      status,
      labels,
      url,
      storyPoints,
    };
  }
}

// ── ADF plain-text extractor ──────────────────────────────────────────────────

function extractAdfText(adf: unknown): string {
  if (!adf || typeof adf !== 'object') return String(adf ?? '');
  const node = adf as { type?: string; text?: string; content?: unknown[] };
  if (node.type === 'text') return node.text ?? '';
  if (Array.isArray(node.content)) {
    return node.content.map(extractAdfText).join(node.type === 'paragraph' ? '\n\n' : '');
  }
  return '';
}
