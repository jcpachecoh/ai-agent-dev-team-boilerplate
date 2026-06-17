import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PhaseExecutionStatus, ProductionOrderStatus } from '@prisma/client';
import { PlantRepository } from '../repository/plant.repository';
import { PlantEventsService } from './plant-events.service';
import type {
  ChainResult,
  CompleteExecutionInput,
  IPhaseChainService,
  PhaseStatusChange,
  QaApproveInput,
} from '../interfaces/plant.interfaces';

@Injectable()
export class PhaseChainService implements IPhaseChainService {
  constructor(
    private readonly plantRepository: PlantRepository,
    private readonly plantEventsService: PlantEventsService,
  ) {}

  async completeExecution(
    tenantId: string,
    executionId: string,
    input: CompleteExecutionInput,
  ): Promise<ChainResult> {
    const execution = await this.plantRepository.findExecutionById(tenantId, executionId);
    if (!execution) {
      throw new NotFoundException(`Phase execution with ID "${executionId}" not found`);
    }

    const orderDetail = await this.plantRepository.findOrderDetailById(tenantId, execution.orderId);
    if (!orderDetail) {
      throw new NotFoundException(`Production order not found for execution "${executionId}"`);
    }

    if (orderDetail.status === ProductionOrderStatus.CANCELLED) {
      throw new ConflictException('Cannot complete phase on a cancelled order');
    }

    if (orderDetail.status === ProductionOrderStatus.COMPLETED) {
      throw new ConflictException('Cannot complete phase on a completed order');
    }

    const executionDetail = orderDetail.executions.find((item) => item.id === executionId);
    if (!executionDetail) {
      throw new NotFoundException(`Phase execution with ID "${executionId}" not found`);
    }

    if (executionDetail.status !== PhaseExecutionStatus.IN_PROCESS) {
      throw new BadRequestException(
        `Cannot complete phase execution in status ${executionDetail.status}`,
      );
    }

    const changedExecutions: PhaseStatusChange[] = [];
    const completedAt = new Date();

    await this.plantRepository.updateExecution(tenantId, executionId, {
      status: PhaseExecutionStatus.COMPLETED,
      completedAt,
      actualMinutes: input.actualMinutes ?? null,
      producedQuantity: input.producedQuantity ?? null,
      notes: input.notes ?? null,
    });

    changedExecutions.push({
      id: executionId,
      orderId: execution.orderId,
      phaseId: execution.phaseId,
      workStationId: execution.workStationId,
      status: PhaseExecutionStatus.COMPLETED,
    });

    const currentPhaseOrder = executionDetail.phase.order;
    const nextExecution = orderDetail.executions.find(
      (item) => item.phase.order === currentPhaseOrder + 1,
    );

    if (nextExecution) {
      const nextStatus = executionDetail.phase.requiresQA
        ? PhaseExecutionStatus.QA_PENDING
        : PhaseExecutionStatus.READY;

      await this.plantRepository.updateExecution(tenantId, nextExecution.id, {
        status: nextStatus,
      });

      changedExecutions.push({
        id: nextExecution.id,
        orderId: execution.orderId,
        phaseId: nextExecution.phaseId,
        workStationId: nextExecution.workStationId,
        status: nextStatus,
      });
    }

    const allCompleted = orderDetail.executions.every(
      (item) => item.id === executionId || item.status === PhaseExecutionStatus.COMPLETED,
    );

    if (allCompleted) {
      await this.plantRepository.updateOrder(tenantId, execution.orderId, {
        status: ProductionOrderStatus.COMPLETED,
        actualEndAt: completedAt,
      });
    }

    this.plantEventsService.emitPhaseStatusChanges(tenantId, changedExecutions);

    return {
      orderId: execution.orderId,
      changedExecutions,
    };
  }

  async qaApproveExecution(
    tenantId: string,
    executionId: string,
    supervisorId: string,
    input?: QaApproveInput,
  ): Promise<ChainResult> {
    const execution = await this.plantRepository.findExecutionById(tenantId, executionId);
    if (!execution) {
      throw new NotFoundException(`Phase execution with ID "${executionId}" not found`);
    }

    const orderDetail = await this.plantRepository.findOrderDetailById(tenantId, execution.orderId);
    if (!orderDetail) {
      throw new NotFoundException(`Production order not found for execution "${executionId}"`);
    }

    if (orderDetail.status === ProductionOrderStatus.CANCELLED) {
      throw new ConflictException('Cannot approve QA on a cancelled order');
    }

    const executionDetail = orderDetail.executions.find((item) => item.id === executionId);
    if (!executionDetail) {
      throw new NotFoundException(`Phase execution with ID "${executionId}" not found`);
    }

    if (!executionDetail.phase.requiresQA) {
      throw new BadRequestException('Phase does not require QA approval');
    }

    if (executionDetail.status !== PhaseExecutionStatus.COMPLETED) {
      throw new BadRequestException(
        `Cannot approve QA for phase execution in status ${executionDetail.status}`,
      );
    }

    if (executionDetail.qaApprovedAt !== null) {
      throw new BadRequestException('Phase execution QA has already been approved');
    }

    const changedExecutions: PhaseStatusChange[] = [];
    const qaApprovedAt = new Date();

    await this.plantRepository.updateExecution(tenantId, executionId, {
      qaApprovedAt,
      qaApprovedBy: supervisorId,
      ...(input?.notes !== undefined ? { notes: input.notes ?? null } : {}),
    });

    const nextExecution = orderDetail.executions.find(
      (item) => item.phase.order === executionDetail.phase.order + 1,
    );

    if (nextExecution?.status === PhaseExecutionStatus.QA_PENDING) {
      await this.plantRepository.updateExecution(tenantId, nextExecution.id, {
        status: PhaseExecutionStatus.READY,
      });

      changedExecutions.push({
        id: nextExecution.id,
        orderId: execution.orderId,
        phaseId: nextExecution.phaseId,
        workStationId: nextExecution.workStationId,
        status: PhaseExecutionStatus.READY,
      });
    }

    this.plantEventsService.emitPhaseStatusChanges(tenantId, changedExecutions);

    return {
      orderId: execution.orderId,
      changedExecutions,
    };
  }
}
