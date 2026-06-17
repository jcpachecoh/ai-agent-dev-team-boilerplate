import type { SedeTableRowData } from '@restopsiq/ui';

import { graphqlRequest } from '@/lib/graphql-client';
import { fetchAdminUsersGql } from '@/features/usuarios/api/usuarios.queries';

import { LOCATION_ASSIGNED_USER_FIELDS, LOCATION_FIELDS } from './sedes.fragments';
import { mapLocationToTableRow, mapLocationUsersToAssigned } from '../mappers/api';
import type { LocationApiModel, LocationAssignedUserApi, LocationConnectionApi } from '../types';

export const LOCATIONS_QUERY = `
  query Locations($restaurantId: ID!, $cursor: String, $take: Int) {
    locations(restaurantId: $restaurantId, cursor: $cursor, take: $take) {
      edges {
        node {
          ${LOCATION_FIELDS}
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const LOCATION_QUERY = `
  query Location($id: ID!, $restaurantId: ID!) {
    location(id: $id, restaurantId: $restaurantId) {
      ${LOCATION_FIELDS}
    }
  }
`;

export const LOCATION_USERS_QUERY = `
  query LocationUsers($locationId: ID!, $restaurantId: ID!) {
    locationUsers(locationId: $locationId, restaurantId: $restaurantId) {
      ${LOCATION_ASSIGNED_USER_FIELDS}
    }
  }
`;

const DEFAULT_PAGE_SIZE = 100;

export async function fetchLocations(
  restaurantId: string,
  take = DEFAULT_PAGE_SIZE,
): Promise<LocationApiModel[]> {
  const items: LocationApiModel[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage && items.length < take) {
    const data = await graphqlRequest<{ locations: LocationConnectionApi }>(LOCATIONS_QUERY, {
      restaurantId,
      cursor,
      take: Math.min(50, take - items.length),
    });

    for (const edge of data.locations.edges) {
      items.push(edge.node);
    }

    hasNextPage = data.locations.pageInfo.hasNextPage;
    cursor = data.locations.pageInfo.endCursor ?? undefined;

    if (!cursor) break;
  }

  return items;
}

export async function fetchLocation(id: string, restaurantId: string): Promise<LocationApiModel> {
  const data = await graphqlRequest<{ location: LocationApiModel }>(LOCATION_QUERY, {
    id,
    restaurantId,
  });
  return data.location;
}

export async function fetchLocationUsers(
  locationId: string,
  restaurantId: string,
): Promise<LocationAssignedUserApi[]> {
  const data = await graphqlRequest<{ locationUsers: LocationAssignedUserApi[] }>(
    LOCATION_USERS_QUERY,
    { locationId, restaurantId },
  );
  return data.locationUsers;
}

export async function fetchLocationTableRows(restaurantId: string): Promise<SedeTableRowData[]> {
  const [locations, adminUsers] = await Promise.all([
    fetchLocations(restaurantId),
    fetchAdminUsersGql(false).catch(() => []),
  ]);

  const rows = await Promise.all(
    locations.map(async (location, index) => {
      const users = await fetchLocationUsers(location.id, restaurantId);
      const assignedUsers = mapLocationUsersToAssigned(users, adminUsers, index);
      return mapLocationToTableRow(location, assignedUsers);
    }),
  );

  return rows;
}
