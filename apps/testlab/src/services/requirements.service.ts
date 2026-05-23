import { http } from './http';

export interface Requirement {
  id: string;
  title: string;
  externalId: string | null;
  description: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementCase {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNTESTED' | 'PASS' | 'FAIL' | 'BLOCKED' | 'RETEST' | 'SKIPPED';
}

export const requirementsService = {
  list: (projectId: string): Promise<Requirement[]> =>
    http.request<Requirement[]>(`/projects/${projectId}/requirements`),
  create: (
    projectId: string,
    payload: { title: string; externalId?: string; description?: string },
  ): Promise<Requirement> =>
    http.request<Requirement>(`/projects/${projectId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCases: (projectId: string, requirementId: string): Promise<RequirementCase[]> =>
    http.request<RequirementCase[]>(`/projects/${projectId}/requirements/${requirementId}/cases`),

  linkCase: (projectId: string, requirementId: string, caseId: string): Promise<void> =>
    http.request<void>(`/projects/${projectId}/requirements/${requirementId}/cases`, {
      method: 'POST',
      body: JSON.stringify({ caseId }),
    }),

  unlinkCase: (projectId: string, requirementId: string, caseId: string): Promise<void> =>
    http.request<void>(`/projects/${projectId}/requirements/${requirementId}/cases/${caseId}`, {
      method: 'DELETE',
    }),
};
