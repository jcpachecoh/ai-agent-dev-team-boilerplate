import type { SedeFormPreviewValues } from '@restopsiq/ui';

export interface LocationApiModel {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  city?: string | null;
  phone?: string | null;
  code?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationAssignedUserApi {
  id: string;
  email: string;
  cedula: string;
  isActive: boolean;
  restaurantId: string;
}

export interface LocationConnectionApi {
  edges: Array<{ node: LocationApiModel; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string | null;
  };
}

export interface CreateLocationInput {
  restaurantId: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  isActive?: boolean;
}

export type SedeFormValues = SedeFormPreviewValues;
