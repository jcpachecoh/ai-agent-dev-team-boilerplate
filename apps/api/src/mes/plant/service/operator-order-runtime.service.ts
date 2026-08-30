import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PhaseExecutionStatus,
  ProductionLogEvent,
  ProductionOrderStatus,
  type StockUnit,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CompleteStepInput,
  FinishOrderInput,
  IOperatorOrderRuntimeService,
  OperatorPauseOrderInput,
  OperatorRuntimeContext,
  OrderRecipePhaseIngredientView,
  OrderRecipePhaseUiStatus,
  OrderRecipeUiStatus,
  OrderRecipeViewResponse,
  StartOrderInput,
} from '../interfaces/operator-runtime.interfaces';
import type { OrderDetail, OrderDetailResponse } from '../interfaces/plant.interfaces';
import { ProductionLogRepository } from '../repository/production-log.repository';
import { PlantRepository } from '../repository/plant.repository';
import { PhaseChainService } from './phase-chain.service';
import { PlantEventsService } from './plant-events.service';
import { PlantService } from './plant.service';

const RUNNING_LOG_EVENTS: ProductionLogEvent[] = [
  ProductionLogEvent.ORDER_STARTED,
  ProductionLogEvent.ORDER_RESUMED,
];

@Injectable()
export class OperatorOrderRuntimeService implements IOperatorOrderRuntimeService {
  constructor(
    private readonly plantRepository: PlantRepository,
    private readonly productionLogRepository: ProductionLogRepository,
    private readonly phaseChainService: PhaseChainService,
    private readonly plantEventsService: PlantEventsService,
    private readonly plantService: PlantService,
  ) {}

  async getOrderRecipeView(tenantId: string, orderId: string): Promise<OrderRecipeViewResponse> {
    const detail = await this.requireOrderDetail(tenantId, orderId);
    const recipe = await this.plantRepository.findRecipeDetailById(tenantId, detail.recipeId);
    if (!recipe) {
      throw new NotFoundException(`Recipe ${detail.recipeId} not found`);
    }

    const supplyItemIds = recipe.phases.flatMap((phase) =>
      phase.inputs.map((input) => input.supplyItemId),
    );
    const supplyItems = await this.plantRepository.findSupplyItemsWithPrincipalSupplier(tenantId, [
      ...new Set(supplyItemIds),
    ]);
    const supplyById = new Map(supplyItems.map((item) => [item.id, item]));

    const isOrderCompleted = detail.status === ProductionOrderStatus.COMPLETED;
    const currentExecution = isOrderCompleted ? null : this.resolveCurrentExecution(detail);
    const lastPhaseOrder = detail.executions.at(-1)?.phase.order ?? 1;
    const currentPhaseIndex = isOrderCompleted
      ? lastPhaseOrder
      : (currentExecution?.phase.order ?? detail.executions[0]?.phase.order ?? 1);
    const stationId =
      currentExecution?.workStationId ??
      detail.executions.at(-1)?.workStationId ??
      detail.executions[0]?.workStationId ??
      '';

    const phases = recipe.phases.map((phase) => {
      const execution = detail.executions.find((item) => item.phaseId === phase.id);
      const isCurrent = !isOrderCompleted && execution?.id === currentExecution?.id;
      const status = isOrderCompleted
        ? ('completed' as OrderRecipePhaseUiStatus)
        : this.mapPhaseUiStatus(execution?.status, isCurrent);

      const ingredients: OrderRecipePhaseIngredientView[] = phase.inputs.map((input) => {
        const supply = supplyById.get(input.supplyItemId);
        const requiredQty = input.quantityPerBatch.mul(detail.batchCount);
        const stock = supply ? Number(supply.stockActualBodega) : null;
        const required = Number(requiredQty);

        return {
          id: input.supplyItemId,
          name: supply?.nombre ?? input.supplyItemId,
          quantity: this.formatQuantity(requiredQty, input.unit),
          unit: input.unit,
          supplier: supply?.supplierProducts[0]?.supplier.razonSocial,
          stockWarning: stock !== null && stock < required,
        };
      });

      return {
        id: execution?.id ?? phase.id,
        executionId: execution?.id,
        index: phase.order,
        name: phase.name,
        durationMinutes: phase.standardMinutes,
        instruction: phase.description ?? undefined,
        ingredients,
        status,
      };
    });

    const logs = await this.productionLogRepository.findByOrder(tenantId, orderId).catch(() => []);

    const workStation = stationId
      ? await this.plantRepository.findWorkStationById(tenantId, stationId)
      : null;
    const stationName = workStation?.name ?? workStation?.code ?? stationId;

    return {
      orderId: detail.id,
      productName: detail.recipe.name,
      recipeName: recipe.name,
      batchSize: `${detail.batchCount.toString()} ${detail.unit.toLowerCase()}`,
      stationId,
      stationName,
      currentPhaseIndex,
      currentStepId: currentExecution?.id,
      status: this.mapOrderUiStatus(detail.status),
      phases,
      elapsedSeconds: this.computeElapsedSeconds(detail, logs),
    };
  }

  async startOrder(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
    input: StartOrderInput,
  ): Promise<OrderDetailResponse> {
    if (context.idempotencyKey) {
      const existing = await this.productionLogRepository.findByIdempotencyKey(
        tenantId,
        context.idempotencyKey,
      );
      if (existing) {
        return this.plantService.findOrderById(tenantId, orderId);
      }
    }

    const detail = await this.requireOrderDetail(tenantId, orderId);
    if (detail.status !== ProductionOrderStatus.PLANNED) {
      throw new ConflictException(`Cannot start order in status ${detail.status}`);
    }

    const execution = detail.executions.find((item) => item.status === PhaseExecutionStatus.READY);
    if (!execution) {
      throw new ConflictException('No phase execution is ready to start');
    }
    if (execution.workStationId !== input.workStationId) {
      throw new BadRequestException('workStationId does not match the current phase station');
    }

    const startedAt = new Date();
    await this.plantRepository.updateOrder(tenantId, orderId, {
      status: ProductionOrderStatus.IN_PROCESS,
      actualStartAt: detail.actualStartAt ?? startedAt,
    });
    await this.plantRepository.updateExecution(tenantId, execution.id, {
      status: PhaseExecutionStatus.IN_PROCESS,
      startedAt,
      responsibleUserId: context.operatorUserId,
    });

    await this.appendLog(tenantId, {
      orderId,
      phaseExecutionId: execution.id,
      employeeId: context.operatorUserId,
      workStationId: input.workStationId,
      event: ProductionLogEvent.ORDER_STARTED,
      idempotencyKey: context.idempotencyKey,
    });

    this.plantEventsService.emitPhaseStatusChanges(tenantId, [
      {
        id: execution.id,
        orderId,
        phaseId: execution.phaseId,
        workStationId: execution.workStationId,
        status: PhaseExecutionStatus.IN_PROCESS,
      },
    ]);

    return this.plantService.findOrderById(tenantId, orderId);
  }

  async pauseOrderByOperator(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
    input: OperatorPauseOrderInput,
  ): Promise<OrderDetailResponse> {
    if (context.idempotencyKey) {
      const existing = await this.productionLogRepository.findByIdempotencyKey(
        tenantId,
        context.idempotencyKey,
      );
      if (existing) {
        return this.plantService.findOrderById(tenantId, orderId);
      }
    }

    const detail = await this.requireOrderDetail(tenantId, orderId);
    if (detail.status !== ProductionOrderStatus.IN_PROCESS) {
      throw new ConflictException(`Cannot pause order in status ${detail.status}`);
    }

    const workStationId = this.resolveActiveWorkStationId(detail);
    const durationSeconds = await this.computeDurationSinceRunning(tenantId, orderId);

    await this.plantRepository.updateOrder(tenantId, orderId, {
      status: ProductionOrderStatus.PAUSED,
    });

    const changes = [];
    for (const execution of detail.executions) {
      if (execution.status !== PhaseExecutionStatus.IN_PROCESS) continue;
      await this.plantRepository.updateExecution(tenantId, execution.id, {
        status: PhaseExecutionStatus.PAUSED,
      });
      changes.push({
        id: execution.id,
        orderId,
        phaseId: execution.phaseId,
        workStationId: execution.workStationId,
        status: PhaseExecutionStatus.PAUSED,
      });
    }

    await this.appendLog(tenantId, {
      orderId,
      phaseExecutionId: this.resolveCurrentExecution(detail)?.id,
      employeeId: context.operatorUserId,
      workStationId,
      event: ProductionLogEvent.ORDER_PAUSED,
      notes: input.notes,
      durationSeconds,
      idempotencyKey: context.idempotencyKey,
    });

    this.plantEventsService.emitPhaseStatusChanges(tenantId, changes);
    return this.plantService.findOrderById(tenantId, orderId);
  }

  async resumeOrderByOperator(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
  ): Promise<OrderDetailResponse> {
    if (context.idempotencyKey) {
      const existing = await this.productionLogRepository.findByIdempotencyKey(
        tenantId,
        context.idempotencyKey,
      );
      if (existing) {
        return this.plantService.findOrderById(tenantId, orderId);
      }
    }

    const detail = await this.requireOrderDetail(tenantId, orderId);
    if (detail.status !== ProductionOrderStatus.PAUSED) {
      throw new ConflictException(`Cannot resume order in status ${detail.status}`);
    }

    const workStationId = this.resolveActiveWorkStationId(detail);
    await this.plantRepository.updateOrder(tenantId, orderId, {
      status: ProductionOrderStatus.IN_PROCESS,
    });

    const changes = [];
    for (const execution of detail.executions) {
      if (execution.status === PhaseExecutionStatus.PAUSED) {
        await this.plantRepository.updateExecution(tenantId, execution.id, {
          status: PhaseExecutionStatus.IN_PROCESS,
        });
        changes.push({
          id: execution.id,
          orderId,
          phaseId: execution.phaseId,
          workStationId: execution.workStationId,
          status: PhaseExecutionStatus.IN_PROCESS,
        });
      }
    }

    const readyExecution = detail.executions.find(
      (execution) => execution.status === PhaseExecutionStatus.READY,
    );
    if (readyExecution) {
      const startedAt = readyExecution.startedAt ?? new Date();
      await this.plantRepository.updateExecution(tenantId, readyExecution.id, {
        status: PhaseExecutionStatus.IN_PROCESS,
        startedAt,
      });
      changes.push({
        id: readyExecution.id,
        orderId,
        phaseId: readyExecution.phaseId,
        workStationId: readyExecution.workStationId,
        status: PhaseExecutionStatus.IN_PROCESS,
      });
    }

    await this.appendLog(tenantId, {
      orderId,
      phaseExecutionId: this.resolveCurrentExecution(detail)?.id,
      employeeId: context.operatorUserId,
      workStationId,
      event: ProductionLogEvent.ORDER_RESUMED,
      idempotencyKey: context.idempotencyKey,
    });

    this.plantEventsService.emitPhaseStatusChanges(tenantId, changes);
    return this.plantService.findOrderById(tenantId, orderId);
  }

  async completeStep(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
    input: CompleteStepInput,
  ): Promise<OrderDetailResponse> {
    if (context.idempotencyKey) {
      const existing = await this.productionLogRepository.findByIdempotencyKey(
        tenantId,
        context.idempotencyKey,
      );
      if (existing) {
        return this.plantService.findOrderById(tenantId, orderId);
      }
    }

    const detail = await this.requireOrderDetail(tenantId, orderId);
    const execution = detail.executions.find((item) => item.id === input.stepId);
    if (!execution || execution.orderId !== orderId) {
      throw new NotFoundException(`Step ${input.stepId} not found on this order`);
    }

    await this.ensureStepRunnableBeforeComplete(
      tenantId,
      detail,
      execution,
      context.operatorUserId,
    );

    const refreshedExecution = (await this.requireOrderDetail(tenantId, orderId)).executions.find(
      (item) => item.id === input.stepId,
    );
    const durationSeconds = refreshedExecution?.startedAt
      ? Math.max(0, Math.floor((Date.now() - refreshedExecution.startedAt.getTime()) / 1000))
      : undefined;

    await this.phaseChainService.completeExecution(tenantId, input.stepId, {
      actualMinutes: input.actualMinutes,
      producedQuantity:
        input.producedQuantity !== undefined ? new Decimal(input.producedQuantity) : undefined,
      notes: input.notes,
    });

    await this.revertPrematureOrderCompletionIfNeeded(tenantId, orderId);

    await this.appendLog(tenantId, {
      orderId,
      phaseExecutionId: execution.id,
      employeeId: context.operatorUserId,
      workStationId: execution.workStationId,
      event: ProductionLogEvent.STEP_COMPLETED,
      notes: input.notes,
      durationSeconds,
      idempotencyKey: context.idempotencyKey,
    });

    return this.plantService.findOrderById(tenantId, orderId);
  }

  async finishOrder(
    tenantId: string,
    orderId: string,
    context: OperatorRuntimeContext,
    input: FinishOrderInput,
  ): Promise<OrderDetailResponse> {
    if (context.idempotencyKey) {
      const existing = await this.productionLogRepository.findByIdempotencyKey(
        tenantId,
        context.idempotencyKey,
      );
      if (existing) {
        return this.plantService.findOrderById(tenantId, orderId);
      }
    }

    let detail = await this.requireOrderDetail(tenantId, orderId);

    if (detail.status === ProductionOrderStatus.CANCELLED) {
      throw new ConflictException('Cannot finish a cancelled order');
    }

    if (
      detail.executions.some((execution) => execution.status === PhaseExecutionStatus.QA_PENDING)
    ) {
      throw new ConflictException('QA approval is required before finishing the order');
    }

    await this.autoCompleteLastActiveStepIfNeeded(tenantId, orderId, detail, context, input);
    detail = await this.requireOrderDetail(tenantId, orderId);

    const incomplete = detail.executions.filter(
      (execution) =>
        execution.status !== PhaseExecutionStatus.COMPLETED &&
        execution.status !== PhaseExecutionStatus.PENDING,
    );
    if (incomplete.length > 0) {
      throw new ConflictException('All steps must be completed before finishing the order');
    }

    if (detail.status !== ProductionOrderStatus.COMPLETED) {
      await this.plantRepository.updateOrder(tenantId, orderId, {
        status: ProductionOrderStatus.COMPLETED,
        actualEndAt: new Date(),
      });
    }

    const workStationId = detail.executions.at(-1)?.workStationId ?? '';
    const durationSeconds = await this.computeDurationSinceRunning(tenantId, orderId);

    await this.appendLog(tenantId, {
      orderId,
      employeeId: context.operatorUserId,
      workStationId,
      event: ProductionLogEvent.ORDER_COMPLETED,
      notes: input.notes,
      durationSeconds,
      idempotencyKey: context.idempotencyKey,
    });

    return this.plantService.findOrderById(tenantId, orderId);
  }

  async appendNoveltyLog(
    tenantId: string,
    orderId: string,
    employeeId: string,
    workStationId: string,
    notes?: string | null,
  ): Promise<void> {
    await this.appendLog(tenantId, {
      orderId,
      employeeId,
      workStationId,
      event: ProductionLogEvent.NOVELTY_ADDED,
      notes,
    });
  }

  private async autoCompleteLastActiveStepIfNeeded(
    tenantId: string,
    orderId: string,
    detail: OrderDetail,
    context: OperatorRuntimeContext,
    input: FinishOrderInput,
  ): Promise<void> {
    const current = this.resolveCurrentExecution(detail);
    if (!current) return;

    const lastPhaseOrder = Math.max(...detail.executions.map((execution) => execution.phase.order));
    if (current.phase.order !== lastPhaseOrder) return;

    if (
      current.status !== PhaseExecutionStatus.READY &&
      current.status !== PhaseExecutionStatus.IN_PROCESS &&
      current.status !== PhaseExecutionStatus.PAUSED
    ) {
      return;
    }

    await this.ensureStepRunnableBeforeComplete(tenantId, detail, current, context.operatorUserId);

    const refreshedBeforeComplete = await this.requireOrderDetail(tenantId, orderId);
    const execution = refreshedBeforeComplete.executions.find((item) => item.id === current.id);
    const startedAt = execution?.startedAt ?? current.startedAt;
    const actualMinutes =
      input.actualMinutes ??
      (startedAt
        ? Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60_000))
        : undefined);

    await this.phaseChainService.completeExecution(tenantId, current.id, {
      actualMinutes,
      notes: input.notes,
    });

    const durationSeconds = startedAt
      ? Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
      : undefined;

    await this.appendLog(tenantId, {
      orderId,
      phaseExecutionId: current.id,
      employeeId: context.operatorUserId,
      workStationId: current.workStationId,
      event: ProductionLogEvent.STEP_COMPLETED,
      notes: input.notes,
      durationSeconds,
    });
  }

  private async ensureStepRunnableBeforeComplete(
    tenantId: string,
    detail: OrderDetail,
    execution: OrderDetail['executions'][number],
    operatorUserId: string,
  ): Promise<void> {
    if (execution.status === PhaseExecutionStatus.IN_PROCESS) {
      return;
    }

    if (execution.status === PhaseExecutionStatus.READY) {
      if (detail.status === ProductionOrderStatus.PLANNED) {
        throw new ConflictException(
          'Cannot complete step in status READY. Start the order first (POST /api/plant/orders/:id/start).',
        );
      }
      if (
        detail.status === ProductionOrderStatus.IN_PROCESS ||
        detail.status === ProductionOrderStatus.PAUSED
      ) {
        await this.resumeOrderIfPaused(tenantId, detail.id, detail.status);
        await this.plantRepository.updateExecution(tenantId, execution.id, {
          status: PhaseExecutionStatus.IN_PROCESS,
          startedAt: execution.startedAt ?? new Date(),
          responsibleUserId: operatorUserId,
        });
        return;
      }
      throw new ConflictException(`Cannot complete step in status ${execution.status}`);
    }

    if (execution.status === PhaseExecutionStatus.PAUSED) {
      if (
        detail.status === ProductionOrderStatus.IN_PROCESS ||
        detail.status === ProductionOrderStatus.PAUSED
      ) {
        await this.resumeOrderIfPaused(tenantId, detail.id, detail.status);
        await this.plantRepository.updateExecution(tenantId, execution.id, {
          status: PhaseExecutionStatus.IN_PROCESS,
        });
        return;
      }
    }

    throw new ConflictException(`Cannot complete step in status ${execution.status}`);
  }

  private async resumeOrderIfPaused(
    tenantId: string,
    orderId: string,
    status: ProductionOrderStatus,
  ): Promise<void> {
    if (status !== ProductionOrderStatus.PAUSED) return;
    await this.plantRepository.updateOrder(tenantId, orderId, {
      status: ProductionOrderStatus.IN_PROCESS,
    });
  }

  private async revertPrematureOrderCompletionIfNeeded(
    tenantId: string,
    orderId: string,
  ): Promise<void> {
    const detail = await this.requireOrderDetail(tenantId, orderId);
    if (detail.status !== ProductionOrderStatus.COMPLETED) {
      return;
    }

    const recipe = await this.plantRepository.findRecipeDetailById(tenantId, detail.recipeId);
    const hasIncompleteExecutions = detail.executions.some(
      (execution) => execution.status !== PhaseExecutionStatus.COMPLETED,
    );
    const missingExecutions = recipe ? detail.executions.length < recipe.phases.length : false;

    if (!hasIncompleteExecutions && !missingExecutions) {
      return;
    }

    await this.plantRepository.updateOrder(tenantId, orderId, {
      status: ProductionOrderStatus.IN_PROCESS,
      actualEndAt: null,
    });
  }

  private async requireOrderDetail(tenantId: string, orderId: string): Promise<OrderDetail> {
    const detail = await this.plantRepository.findOrderDetailById(tenantId, orderId);
    if (!detail) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }
    return detail;
  }

  private resolveCurrentExecution(detail: OrderDetail) {
    const sorted = [...detail.executions].sort((a, b) => a.phase.order - b.phase.order);

    const active = sorted.find(
      (execution) =>
        execution.status === PhaseExecutionStatus.IN_PROCESS ||
        execution.status === PhaseExecutionStatus.PAUSED ||
        execution.status === PhaseExecutionStatus.READY ||
        execution.status === PhaseExecutionStatus.QA_PENDING,
    );
    if (active) return active;

    return sorted.find((execution) => execution.status !== PhaseExecutionStatus.COMPLETED) ?? null;
  }

  private resolveActiveWorkStationId(detail: OrderDetail): string {
    const current = this.resolveCurrentExecution(detail);
    if (current?.workStationId) return current.workStationId;
    const fromSession = detail.activeSessions[0]?.workStationId;
    if (fromSession) return fromSession;
    throw new BadRequestException('workStationId could not be resolved for this order');
  }

  private mapOrderUiStatus(status: ProductionOrderStatus): OrderRecipeUiStatus {
    if (status === ProductionOrderStatus.COMPLETED) return 'completed';
    if (status === ProductionOrderStatus.PAUSED) return 'paused';
    if (status === ProductionOrderStatus.IN_PROCESS) return 'in_progress';
    return 'pending';
  }

  private mapPhaseUiStatus(
    status: PhaseExecutionStatus | undefined,
    isCurrent: boolean,
  ): OrderRecipePhaseUiStatus {
    if (status === PhaseExecutionStatus.COMPLETED) return 'completed';
    if (isCurrent) return 'current';
    return 'pending';
  }

  private formatQuantity(quantity: Decimal, unit: StockUnit): string {
    const value = quantity.toFixed(3).replace(/\.?0+$/, '');
    return `${value} ${unit.toLowerCase()}`;
  }

  private async appendLog(
    tenantId: string,
    data: {
      orderId: string;
      phaseExecutionId?: string;
      employeeId: string;
      workStationId: string;
      event: ProductionLogEvent;
      notes?: string | null;
      durationSeconds?: number;
      idempotencyKey?: string;
    },
  ): Promise<void> {
    await this.productionLogRepository.append({
      tenantId,
      orderId: data.orderId,
      phaseExecutionId: data.phaseExecutionId,
      employeeId: data.employeeId,
      workStationId: data.workStationId,
      event: data.event,
      notes: data.notes,
      durationSeconds: data.durationSeconds,
      idempotencyKey: data.idempotencyKey,
    });
  }

  private async computeDurationSinceRunning(
    tenantId: string,
    orderId: string,
  ): Promise<number | undefined> {
    const lastRunning = await this.productionLogRepository.findLastByOrderAndEvents(
      tenantId,
      orderId,
      RUNNING_LOG_EVENTS,
    );
    if (!lastRunning) return undefined;
    return Math.max(0, Math.floor((Date.now() - lastRunning.timestamp.getTime()) / 1000));
  }

  private computeElapsedSeconds(
    detail: OrderDetail,
    logs: Array<{ event: ProductionLogEvent; timestamp: Date }>,
  ): number | undefined {
    if (!detail.actualStartAt) return undefined;

    let elapsedMs = Date.now() - detail.actualStartAt.getTime();
    let pausedAt: number | null = null;

    for (const log of logs) {
      if (log.event === ProductionLogEvent.ORDER_PAUSED) {
        pausedAt = log.timestamp.getTime();
      } else if (log.event === ProductionLogEvent.ORDER_RESUMED && pausedAt !== null) {
        elapsedMs -= log.timestamp.getTime() - pausedAt;
        pausedAt = null;
      }
    }

    if (detail.status === ProductionOrderStatus.PAUSED && pausedAt !== null) {
      elapsedMs -= Date.now() - pausedAt;
    }

    return Math.max(0, Math.floor(elapsedMs / 1000));
  }
}
