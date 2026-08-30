import { graphqlRequest } from '@/lib/graphql-client';

import type {
  CreateLaborLegalParameterFormValues,
  LaborLegalParameter,
  UpdateLaborLegalParameterFormValues,
} from '../types';

const LABOR_LEGAL_PARAMETER_FIELDS = `
  id tenantId key value validFrom validTo source isGlobal createdAt updatedAt deletedAt
`;

export const LABOR_LEGAL_PARAMETERS_QUERY = `
  query LaborLegalParameters {
    laborLegalParameters {
      ${LABOR_LEGAL_PARAMETER_FIELDS}
    }
  }
`;

export const LABOR_LEGAL_PARAMETER_HISTORY_QUERY = `
  query LaborLegalParameterHistory($key: String!) {
    laborLegalParameterHistory(key: $key) {
      ${LABOR_LEGAL_PARAMETER_FIELDS}
    }
  }
`;

export const CREATE_LABOR_LEGAL_PARAMETER_MUTATION = `
  mutation CreateLaborLegalParameter($input: CreateLaborLegalParameterInput!) {
    createLaborLegalParameter(input: $input) {
      ${LABOR_LEGAL_PARAMETER_FIELDS}
    }
  }
`;

export const UPDATE_LABOR_LEGAL_PARAMETER_MUTATION = `
  mutation UpdateLaborLegalParameter($id: ID!, $input: UpdateLaborLegalParameterInput!) {
    updateLaborLegalParameter(id: $id, input: $input) {
      ${LABOR_LEGAL_PARAMETER_FIELDS}
    }
  }
`;

export const DELETE_LABOR_LEGAL_PARAMETER_MUTATION = `
  mutation DeleteLaborLegalParameter($id: ID!) {
    deleteLaborLegalParameter(id: $id)
  }
`;

export async function fetchLaborLegalParametersGql(): Promise<LaborLegalParameter[]> {
  const data = await graphqlRequest<{ laborLegalParameters: LaborLegalParameter[] }>(
    LABOR_LEGAL_PARAMETERS_QUERY,
  );
  return data.laborLegalParameters;
}

export async function fetchLaborLegalParameterHistoryGql(
  key: string,
): Promise<LaborLegalParameter[]> {
  const data = await graphqlRequest<{ laborLegalParameterHistory: LaborLegalParameter[] }>(
    LABOR_LEGAL_PARAMETER_HISTORY_QUERY,
    { key },
  );
  return data.laborLegalParameterHistory;
}

export async function createLaborLegalParameterGql(
  input: CreateLaborLegalParameterFormValues,
): Promise<LaborLegalParameter> {
  const data = await graphqlRequest<{ createLaborLegalParameter: LaborLegalParameter }>(
    CREATE_LABOR_LEGAL_PARAMETER_MUTATION,
    { input },
  );
  return data.createLaborLegalParameter;
}

export async function updateLaborLegalParameterGql(
  id: string,
  input: UpdateLaborLegalParameterFormValues,
): Promise<LaborLegalParameter> {
  const data = await graphqlRequest<{ updateLaborLegalParameter: LaborLegalParameter }>(
    UPDATE_LABOR_LEGAL_PARAMETER_MUTATION,
    { id, input },
  );
  return data.updateLaborLegalParameter;
}

export async function deleteLaborLegalParameterGql(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteLaborLegalParameter: boolean }>(
    DELETE_LABOR_LEGAL_PARAMETER_MUTATION,
    { id },
  );
  return data.deleteLaborLegalParameter;
}
