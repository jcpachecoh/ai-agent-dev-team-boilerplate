import { APIRequestContext } from '@playwright/test';
import { graphqlRequest, DELETE_TEST_SEDE } from './graphql.helper';

export async function cleanupSede(request: APIRequestContext, id: string): Promise<void> {
  await graphqlRequest(request, DELETE_TEST_SEDE, { id });
}
