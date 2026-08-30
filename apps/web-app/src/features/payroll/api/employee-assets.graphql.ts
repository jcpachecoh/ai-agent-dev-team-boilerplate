import { graphqlRequest } from '@/lib/graphql-client';
import type {
  CreateEmployeeAssetInput,
  EmployeeAsset,
  UpdateEmployeeAssetInput,
} from '../types/employee-asset.types';

const EMPLOYEE_ASSETS_QUERY = `
  query EmployeeAssets($employeeId: ID!, $status: AssetStatus) {
    employeeAssets(employeeId: $employeeId, status: $status) {
      id
      tenantId
      employeeId
      assetName
      type
      assignmentDate
      value
      status
      notes
      storageObjectId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_EMPLOYEE_ASSET_MUTATION = `
  mutation CreateEmployeeAsset($input: CreateEmployeeAssetInput!) {
    createEmployeeAsset(input: $input) {
      id
      assetName
      type
      value
      status
      assignmentDate
      notes
      storageObjectId
      createdAt
    }
  }
`;

const UPDATE_EMPLOYEE_ASSET_MUTATION = `
  mutation UpdateEmployeeAsset($id: ID!, $input: UpdateEmployeeAssetInput!) {
    updateEmployeeAsset(id: $id, input: $input) {
      id
      status
      value
      notes
      updatedAt
    }
  }
`;

interface EmployeeAssetsQueryResult {
  employeeAssets: EmployeeAsset[];
}

interface CreateEmployeeAssetResult {
  createEmployeeAsset: EmployeeAsset;
}

interface UpdateEmployeeAssetResult {
  updateEmployeeAsset: Pick<EmployeeAsset, 'id' | 'status' | 'value' | 'notes' | 'updatedAt'>;
}

export async function fetchEmployeeAssets(employeeId: string): Promise<EmployeeAsset[]> {
  const result = await graphqlRequest<EmployeeAssetsQueryResult>(EMPLOYEE_ASSETS_QUERY, {
    employeeId,
  });
  return result.employeeAssets;
}

export async function createEmployeeAsset(input: CreateEmployeeAssetInput): Promise<EmployeeAsset> {
  const result = await graphqlRequest<CreateEmployeeAssetResult>(CREATE_EMPLOYEE_ASSET_MUTATION, {
    input,
  });
  return result.createEmployeeAsset;
}

export async function updateEmployeeAsset(
  id: string,
  input: UpdateEmployeeAssetInput,
): Promise<UpdateEmployeeAssetResult['updateEmployeeAsset']> {
  const result = await graphqlRequest<UpdateEmployeeAssetResult>(UPDATE_EMPLOYEE_ASSET_MUTATION, {
    id,
    input,
  });
  return result.updateEmployeeAsset;
}
