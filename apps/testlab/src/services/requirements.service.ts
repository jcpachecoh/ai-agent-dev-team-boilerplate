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
};
