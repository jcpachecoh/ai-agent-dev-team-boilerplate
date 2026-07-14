import { graphqlRequest } from '@/lib/graphql-client';

import type { ConsentType, EmployeeConsentSummary } from '../types';

const SUMMARY_FIELDS = `
  activePolicyVersion
  biometricEnrolled
  alternateMethodAvailable
  policy {
    id
    version
    title
    content
    consentLabel
    publishedAt
  }
  consents {
    consentType
    granted
    policyVersion
    grantedAt
    revokedAt
    canUseFeature
  }
`;

export const EMPLOYEE_DATA_CONSENTS_QUERY = `
  query EmployeeDataConsents($userId: ID!) {
    employeeDataConsents(userId: $userId) {
      ${SUMMARY_FIELDS}
    }
  }
`;

export const REVOKE_DATA_CONSENT_MUTATION = `
  mutation RevokeDataConsent($input: RevokeDataConsentInput!) {
    revokeDataConsent(input: $input) {
      id
      consentType
      granted
      revokedAt
    }
  }
`;

export async function fetchEmployeeDataConsentsGql(
  userId: string,
): Promise<EmployeeConsentSummary> {
  const data = await graphqlRequest<{ employeeDataConsents: EmployeeConsentSummary }>(
    EMPLOYEE_DATA_CONSENTS_QUERY,
    { userId },
  );
  return data.employeeDataConsents;
}

export async function revokeDataConsentGql(consentType: ConsentType): Promise<void> {
  await graphqlRequest(REVOKE_DATA_CONSENT_MUTATION, {
    input: { consentType },
  });
}
