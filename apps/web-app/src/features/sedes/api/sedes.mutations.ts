import { graphqlRequest } from '@/lib/graphql-client';

import { LOCATION_FIELDS } from './sedes.fragments';
import type { CreateLocationInput, LocationApiModel, UpdateLocationInput } from '../types';

export const CREATE_LOCATION_MUTATION = `
  mutation CreateLocation($input: CreateLocationInput!) {
    createLocation(input: $input) {
      ${LOCATION_FIELDS}
    }
  }
`;

export const UPDATE_LOCATION_MUTATION = `
  mutation UpdateLocation($id: ID!, $input: UpdateLocationInput!) {
    updateLocation(id: $id, input: $input) {
      ${LOCATION_FIELDS}
    }
  }
`;

export const TOGGLE_LOCATION_STATUS_MUTATION = `
  mutation ToggleLocationStatus($id: ID!) {
    toggleLocationStatus(id: $id) {
      ${LOCATION_FIELDS}
    }
  }
`;

export const DELETE_LOCATION_MUTATION = `
  mutation DeleteLocation($id: ID!) {
    deleteLocation(id: $id)
  }
`;

export const REMOVE_USER_FROM_LOCATION_MUTATION = `
  mutation RemoveUserFromLocation($userId: ID!, $locationId: ID!) {
    removeUserFromLocation(userId: $userId, locationId: $locationId)
  }
`;

export const ASSIGN_USER_TO_LOCATION_MUTATION = `
  mutation AssignUserToLocation($userId: ID!, $locationId: ID!) {
    assignUserToLocation(userId: $userId, locationId: $locationId) {
      id
      userId
      locationId
      restaurantId
      createdAt
    }
  }
`;

export async function createLocation(input: CreateLocationInput): Promise<LocationApiModel> {
  const data = await graphqlRequest<{ createLocation: LocationApiModel }>(
    CREATE_LOCATION_MUTATION,
    { input },
  );
  return data.createLocation;
}

export async function updateLocation(
  id: string,
  input: UpdateLocationInput,
): Promise<LocationApiModel> {
  const data = await graphqlRequest<{ updateLocation: LocationApiModel }>(
    UPDATE_LOCATION_MUTATION,
    { id, input },
  );
  return data.updateLocation;
}

export async function toggleLocationStatus(id: string): Promise<LocationApiModel> {
  const data = await graphqlRequest<{ toggleLocationStatus: LocationApiModel }>(
    TOGGLE_LOCATION_STATUS_MUTATION,
    { id },
  );
  return data.toggleLocationStatus;
}

export async function deleteLocation(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteLocation: boolean }>(DELETE_LOCATION_MUTATION, { id });
  return data.deleteLocation;
}

export async function removeUserFromLocation(userId: string, locationId: string): Promise<boolean> {
  const data = await graphqlRequest<{ removeUserFromLocation: boolean }>(
    REMOVE_USER_FROM_LOCATION_MUTATION,
    { userId, locationId },
  );
  return data.removeUserFromLocation;
}

export async function assignUserToLocation(userId: string, locationId: string): Promise<void> {
  await graphqlRequest<{ assignUserToLocation: { id: string } }>(ASSIGN_USER_TO_LOCATION_MUTATION, {
    userId,
    locationId,
  });
}
