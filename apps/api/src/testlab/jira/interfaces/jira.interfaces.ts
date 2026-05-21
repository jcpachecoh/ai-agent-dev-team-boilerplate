import type { JiraLink, JiraEntityType } from '@prisma/client';

// ── Jira proxy types ──────────────────────────────────────────────────────────

export interface JiraProject {
  key: string;
  name: string;
  id: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  labels: string[];
  url: string;
  storyPoints: number | null;
}

// ── Link types ────────────────────────────────────────────────────────────────

export interface CreateLinkInput {
  projectId: string;
  issueKey: string;
  entityType: JiraEntityType;
  entityId: string;
}

// ── Repository contract ───────────────────────────────────────────────────────

export interface IJiraRepository {
  createLink(
    input: CreateLinkInput & { issueSummary: string; issueUrl: string },
  ): Promise<JiraLink>;
  findLinksByProject(projectId: string): Promise<JiraLink[]>;
  deleteLink(id: string): Promise<void>;
}

// ── Service contract ──────────────────────────────────────────────────────────

export interface IJiraService {
  getProjects(): Promise<JiraProject[]>;
  searchIssues(projectKey: string, query?: string, limit?: number): Promise<JiraIssue[]>;
  getIssue(issueKey: string): Promise<JiraIssue>;
  createLink(input: CreateLinkInput): Promise<JiraLink>;
  findLinksByProject(projectId: string): Promise<JiraLink[]>;
  deleteLink(id: string): Promise<void>;
}
