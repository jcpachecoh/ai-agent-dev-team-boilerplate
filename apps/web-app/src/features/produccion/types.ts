export type ProductionOrderStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'IN_PROCESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProductionPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export type ProductionShift = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export type PhaseExecutionStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROCESS'
  | 'PAUSED'
  | 'QA_PENDING'
  | 'COMPLETED';

export type ProductionCommitteeStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';

export interface ProductionCommitteeListItem {
  id: string;
  number: string;
  status: ProductionCommitteeStatus;
  ordersCount: number;
  memberCount: number;
  createdAt: string;
}

export interface ProductionCommitteeMember {
  userId: string;
  email: string;
  roleCode: string;
}

export interface ProductionCommitteeDetail {
  id: string;
  tenantId: string;
  number: string;
  status: ProductionCommitteeStatus;
  ordersCount: number;
  members: ProductionCommitteeMember[];
  createdAt: string;
  updatedAt: string;
}

export interface OperationsAdminUser {
  userId: string;
  email: string;
  roleCode: string;
}

export interface CreateProductionCommitteeInput {
  memberUserIds: string[];
  status?: 'DRAFT' | 'ACTIVE';
}

export interface UpdateProductionCommitteeInput {
  status?: ProductionCommitteeStatus;
  memberUserIds?: string[];
}

export interface ListProductionCommitteesFilters {
  status?: ProductionCommitteeStatus;
  page?: number;
  limit?: number;
}

export interface ProductionOrderListItem {
  id: string;
  tenantId: string;
  number: string;
  status: ProductionOrderStatus;
  priority: ProductionPriority;
  shift: ProductionShift;
  plannedStartAt: string;
  recipeId: string;
  recipeName?: string;
  committeeId?: string | null;
  committeeNumber?: string | null;
}

export type ProductionQualityCheckType =
  | 'LIBERACION_MP'
  | 'CORRECCION'
  | 'ACCION_CORRECTIVA'
  | 'ENTREGA'
  | 'RECIBE';

export interface ProductionOrderMaterial {
  id: string;
  materialName: string;
  requiredQuantity: string;
  unit: string;
  lotNumber: string | null;
  consumedQuantity: string | null;
}

export interface ProductionByproduct {
  id: string;
  itemName: string;
  unit: string;
  actualQuantity: string | null;
  lotNumber: string | null;
  expirationDate: string | null;
}

export interface ProductionQualityCheck {
  id: string;
  checkType: ProductionQualityCheckType;
  temperature: string | null;
  color: string | null;
  smell: string | null;
  texture: string | null;
  notes: string | null;
}

export interface PhaseExecutionDetail {
  id: string;
  phaseId: string;
  phaseOrder: number;
  phaseName: string;
  requiresQA: boolean;
  workStationId: string;
  status: PhaseExecutionStatus;
  plannedMinutes: number;
  actualMinutes: number | null;
  producedQuantity: string | null;
  qaApprovedAt: string | null;
  qaApprovedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  operatorCount: number | null;
  deliveredQuantity: string | null;
  responsibleUserId: string | null;
  responsibleName: string | null;
  notes: string | null;
}

export interface ProductionOrderDetail {
  id: string;
  tenantId: string;
  number: string;
  recipeId: string;
  recipeName: string;
  recipeVersion: number;
  status: ProductionOrderStatus;
  priority: ProductionPriority;
  shift: ProductionShift;
  batchCount: number;
  plannedQuantity: string;
  producedQuantity: string | null;
  unit: string;
  plannedStartAt: string;
  plannedEndAt: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
  supervisorId: string | null;
  notes: string | null;
  lotNumber: string | null;
  productionDate: string | null;
  deliveryDate: string | null;
  packageWeight: string | null;
  batchWeight: string | null;
  committeeId?: string | null;
  committeeNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  materials: ProductionOrderMaterial[];
  byproducts: ProductionByproduct[];
  qualityChecks: ProductionQualityCheck[];
  executions: PhaseExecutionDetail[];
  activeOperators: Array<{
    sessionId: string;
    operatorUserId: string;
    workStationId: string;
    phaseExecutionId: string | null;
    startedAt: string;
  }>;
}

export interface ProductionRecipeSummary {
  id: string;
  name: string;
  isActive: boolean;
  batchSize: string;
  batchUnit: string;
  version: number;
}

export interface CreateProductionOrderInput {
  recipeId: string;
  batchCount: number;
  shift: ProductionShift;
  priority?: ProductionPriority;
  plannedStartAt: string;
  plannedEndAt: string;
  notes?: string;
  lotNumber?: string;
  productionDate?: string;
  deliveryDate?: string;
  batchWeight?: string;
  committeeId: string;
}

export interface UpdateProductionOrderInput {
  batchCount?: number;
  shift?: ProductionShift;
  priority?: ProductionPriority;
  plannedStartAt?: string;
  plannedEndAt?: string;
  notes?: string | null;
}

export interface UpdateProductionOrderDocumentInput {
  lotNumber?: string | null;
  productionDate?: string | null;
  deliveryDate?: string | null;
  batchWeight?: string | null;
  notes?: string | null;
  materials?: Array<{
    id: string;
    lotNumber?: string | null;
    consumedQuantity?: string | null;
  }>;
  byproducts?: Array<{
    id?: string;
    itemName: string;
    unit: string;
    actualQuantity?: string | null;
    lotNumber?: string | null;
    expirationDate?: string | null;
    _delete?: boolean;
  }>;
  qualityChecks?: Array<{
    checkType: ProductionQualityCheckType;
    temperature?: string | null;
    color?: string | null;
    smell?: string | null;
    texture?: string | null;
    notes?: string | null;
  }>;
}

export interface UpdateExecutionRouteInput {
  operatorCount?: number;
  deliveredQuantity?: string;
  responsibleUserId?: string;
  notes?: string;
}

/** Router state when opening an OP from committee detail vs orders list. */
export interface ProductionOrderDetailNavState {
  fromCommitteeId?: string;
  fromCommitteeNumber?: string;
}

export interface ListProductionOrdersFilters {
  status?: ProductionOrderStatus;
  shift?: ProductionShift;
  priority?: ProductionPriority;
  plannedStartFrom?: string;
  plannedStartTo?: string;
  committeeId?: string;
}
