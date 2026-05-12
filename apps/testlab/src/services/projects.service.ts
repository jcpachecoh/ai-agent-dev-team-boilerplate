import { http } from './http';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  slug: string;
  description?: string;
}

export const projectsService = {
  list: (): Promise<Project[]> => http.request<Project[]>('/projects'),
  getById: (id: string): Promise<Project> => http.request<Project>(`/projects/${id}`),
  create: (payload: CreateProjectPayload): Promise<Project> =>
    http.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
