import type { OrderDetailResponse } from './plant.interfaces';

export type OrderRecipeUiStatus = 'pending' | 'in_progress' | 'paused' | 'completed';

export type OrderRecipePhaseUiStatus = 'completed' | 'current' | 'pending';

export interface OrderRecipePhaseIngredientView {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  supplier?: string;
  stockWarning: boolean;
}

export interface OrderRecipePhaseView {
  id: string;
  executionId?: string;
  index: number;
  name: string;
  durationMinutes: number;
  instruction?: string;
  ingredients: OrderRecipePhaseIngredientView[];
  status: OrderRecipePhaseUiStatus;
}

export interface OrderRecipeViewResponse {
  orderId: string;
  productName: string;
  recipeName: string;
  batchSize: string;
  stationId: string;
  stationName: string;
  currentPhaseIndex: number;
  currentStepId?: string;
  status: OrderRecipeUiStatus;
  phases: OrderRecipePhaseView[];
  elapsedSeconds?: number;
}

export interface StartOrderInput {
  workStationId: string;
}

export interface OperatorPauseOrderInput {
  notes?: string;
}

export interface CompleteStepInput {
  stepId: string;
  actualMinutes?: number;
  producedQuantity?: string;
  notes?: string;
}

export interface FinishOrderInput {
  actualMinutes?: number;
  notes?: string;
}

export interface OperatorRuntimeContext {
  operatorUserId: string;
  idempotencyKey?: string;
}

export interface IOperatorOrderRuntimeService {
  getOrderRecipeView(tenantId: string, orderId: string): Promise<OrderRecipeViewResponse>;
  startOrder(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
    input: StartOrderInput,
  ): Promise<OrderDetailResponse>;
  pauseOrderByOperator(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
    input: OperatorPauseOrderInput,
  ): Promise<OrderDetailResponse>;
  resumeOrderByOperator(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
  ): Promise<OrderDetailResponse>;
  completeStep(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
    input: CompleteStepInput,
  ): Promise<OrderDetailResponse>;
  finishOrder(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
    input: FinishOrderInput,
  ): Promise<OrderDetailResponse>;
}
