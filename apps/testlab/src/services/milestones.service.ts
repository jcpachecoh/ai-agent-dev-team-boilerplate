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
};
