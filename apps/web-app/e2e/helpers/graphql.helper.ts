import { APIRequestContext } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/graphql';
const SERVICE_TOKEN = process.env.E2E_SERVICE_TOKEN ?? '';

export async function graphqlRequest(
  request: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<unknown> {
  const response = await request.post(API_URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_TOKEN}`,
    },
    data: { query, variables },
  });
  const json = await response.json();
  if (json.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

export const CREATE_TEST_SEDE = `
  mutation CreateTestSede($input: CreateLocationInput!) {
    createLocation(input: $input) {
      id
      name
    }
  }
`;

export const DELETE_TEST_SEDE = `
  mutation DeleteTestSede($id: String!) {
    deleteLocation(id: $id) {
      id
    }
  }
`;
