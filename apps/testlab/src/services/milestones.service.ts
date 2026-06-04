import { http } from './http';

export interface Milestone {
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneCase {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNTESTED' | 'PASS' | 'FAIL' | 'BLOCKED' | 'RETEST' | 'SKIPPED';
}

export const milestonesService = {
  list: (projectId: string): Promise<Milestone[]> =>
    http.request<Milestone[]>(`/projects/${projectId}/milestones`),
  create: (
    projectId: string,
    payload: { name: string; dueDate?: string; description?: string },
  ): Promise<Milestone> =>
    http.request<Milestone>(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCases: (projectId: string, milestoneId: string): Promise<MilestoneCase[]> =>
    http.request<MilestoneCase[]>(`/projects/${projectId}/milestones/${milestoneId}/cases`),

  linkCase: (projectId: string, milestoneId: string, caseId: string): Promise<void> =>
    http.request<void>(`/projects/${projectId}/milestones/${milestoneId}/cases`, {
      method: 'POST',
      body: JSON.stringify({ caseId }),
    }),

  unlinkCase: (projectId: string, milestoneId: string, caseId: string): Promise<void> =>
    http.request<void>(`/projects/${projectId}/milestones/${milestoneId}/cases/${caseId}`, {
      method: 'DELETE',
    }),
};
