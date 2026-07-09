import { graphqlRequest } from '@/lib/graphql-client';

import type {
  AvailableSupplyItem,
  DotacionDelivery,
  DotacionPage,
  GenerateEntitlementsResult,
  RegisterDotacionInput,
} from '../types/dotaciones.types';

// ── Fragments ─────────────────────────────────────────────────────────────────

const DELIVERY_FIELDS = `
  id
  tenantId
  employeeId
  period
  supplyItemId
  quantity
  deliveredAt
  status
  signedReceiptUrl
  stockMovementId
  noAplicaReason
  createdAt
  updatedAt
  supplyItem {
    id
    nombre
    talla
  }
`;

// ── Queries ───────────────────────────────────────────────────────────────────

const DOTACION_PERIOD_QUERY = `
  query DotacionPeriod($period: String!, $locationId: ID, $cursor: String, $take: Int) {
    dotacionPeriod(period: $period, locationId: $locationId, cursor: $cursor, take: $take) {
      edges {
        ${DELIVERY_FIELDS}
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const AVAILABLE_ITEMS_QUERY = `
  query AvailableItemsForDotacion {
    availableItemsForDotacion {
      id
      nombre
      talla
      genero
      subcategoria
      stockActualBodega
      unidadBase
    }
  }
`;

const DOTACION_DELIVERY_QUERY = `
  query DotacionDelivery($id: ID!) {
    dotacionDelivery(id: $id) {
      ${DELIVERY_FIELDS}
    }
  }
`;

const EMPLOYEE_DOTACION_HISTORY_QUERY = `
  query EmployeeDotacionHistory($employeeId: ID!, $cursor: String, $take: Int) {
    employeeDotacionHistory(employeeId: $employeeId, cursor: $cursor, take: $take) {
      edges {
        ${DELIVERY_FIELDS}
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ── Mutations ─────────────────────────────────────────────────────────────────

const GENERATE_ENTITLEMENTS_MUTATION = `
  mutation GeneratePeriodEntitlements($period: String!) {
    generatePeriodEntitlements(period: $period) {
      processed
      created
      skipped
    }
  }
`;

const REGISTER_DELIVERY_MUTATION = `
  mutation RegisterDotacionDelivery($input: RegisterDotacionDeliveryInput!) {
    registerDotacionDelivery(input: $input) {
      ${DELIVERY_FIELDS}
    }
  }
`;

const MARK_NOT_APPLICABLE_MUTATION = `
  mutation MarkDotacionNotApplicable($id: ID!, $reason: String) {
    markDotacionNotApplicable(id: $id, reason: $reason) {
      id
      status
      noAplicaReason
      updatedAt
    }
  }
`;

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchDotacionPeriod(
  period: string,
  locationId?: string,
  cursor?: string,
  take = 50,
): Promise<DotacionPage> {
  const result = await graphqlRequest<{ dotacionPeriod: DotacionPage }>(DOTACION_PERIOD_QUERY, {
    period,
    locationId: locationId ?? null,
    cursor: cursor ?? null,
    take,
  });
  return result.dotacionPeriod;
}

export async function fetchAvailableItemsForDotacion(): Promise<AvailableSupplyItem[]> {
  const result = await graphqlRequest<{ availableItemsForDotacion: AvailableSupplyItem[] }>(
    AVAILABLE_ITEMS_QUERY,
  );
  return result.availableItemsForDotacion;
}

export async function fetchDotacionDelivery(id: string): Promise<DotacionDelivery> {
  const result = await graphqlRequest<{ dotacionDelivery: DotacionDelivery }>(
    DOTACION_DELIVERY_QUERY,
    { id },
  );
  return result.dotacionDelivery;
}

export async function fetchEmployeeDotacionHistory(
  employeeId: string,
  cursor?: string,
  take = 20,
): Promise<DotacionPage> {
  const result = await graphqlRequest<{ employeeDotacionHistory: DotacionPage }>(
    EMPLOYEE_DOTACION_HISTORY_QUERY,
    { employeeId, cursor: cursor ?? null, take },
  );
  return result.employeeDotacionHistory;
}

export async function generatePeriodEntitlements(
  period: string,
): Promise<GenerateEntitlementsResult> {
  const result = await graphqlRequest<{ generatePeriodEntitlements: GenerateEntitlementsResult }>(
    GENERATE_ENTITLEMENTS_MUTATION,
    { period },
  );
  return result.generatePeriodEntitlements;
}

export async function registerDotacionDelivery(
  input: RegisterDotacionInput,
): Promise<DotacionDelivery> {
  const result = await graphqlRequest<{ registerDotacionDelivery: DotacionDelivery }>(
    REGISTER_DELIVERY_MUTATION,
    { input },
  );
  return result.registerDotacionDelivery;
}

export async function markDotacionNotApplicable(
  id: string,
  reason?: string,
): Promise<Pick<DotacionDelivery, 'id' | 'status' | 'noAplicaReason' | 'updatedAt'>> {
  const result = await graphqlRequest<{
    markDotacionNotApplicable: Pick<
      DotacionDelivery,
      'id' | 'status' | 'noAplicaReason' | 'updatedAt'
    >;
  }>(MARK_NOT_APPLICABLE_MUTATION, { id, reason: reason ?? null });
  return result.markDotacionNotApplicable;
}
