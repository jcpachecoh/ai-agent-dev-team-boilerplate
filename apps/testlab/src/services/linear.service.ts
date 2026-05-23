import { http } from './http';

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  priority: number;
  state: string | null;
  labels: string[];
  url: string;
}

export interface LinearLink {
  id: string;
  projectId: string;
  issueId: string;
  entityType: string;
  entityId: string;
  issueTitle: string;
  issueUrl: string;
  createdAt: string;
}

export interface CreateLinkPayload {
  issueId: string;
  entityType: 'testCase' | 'milestone' | 'requirement';
  entityId: string;
  issueTitle: string;
  issueUrl: string;
}

export const linearService = {
  listTeams: (): Promise<LinearTeam[]> => http.request<LinearTeam[]>('/linear/teams'),

  searchIssues: (teamId: string, query?: string, limit = 25): Promise<LinearIssue[]> => {
    const params = new URLSearchParams({ teamId });
    if (query) params.set('query', query);
    params.set('limit', String(limit));
    return http.request<LinearIssue[]>(`/linear/issues?${params.toString()}`);
  },

  getIssue: (issueId: string): Promise<LinearIssue> =>
    http.request<LinearIssue>(`/linear/issues/${issueId}`),

  listLinks: (projectId: string): Promise<LinearLink[]> =>
    http.request<LinearLink[]>(`/projects/${projectId}/linear-links`),

  createLink: (projectId: string, payload: CreateLinkPayload): Promise<LinearLink> =>
    http.request<LinearLink>(`/projects/${projectId}/linear-links`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteLink: (projectId: string, linkId: string): Promise<void> =>
    http.request<void>(`/projects/${projectId}/linear-links/${linkId}`, { method: 'DELETE' }),
};
