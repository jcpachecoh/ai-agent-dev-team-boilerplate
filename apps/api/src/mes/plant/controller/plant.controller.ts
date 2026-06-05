import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  OperationalRole,
  type PhaseInput,
  type ProductionPhase,
  type ProductionRecipe,
  type WorkStation,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MesRolesGuard } from '../../auth/guards/mes-roles.guard';
import { PlantAuthGuard } from '../guards/plant-auth.guard';
import type { MesJwtPayload } from '../../auth/interfaces/mes-auth.interfaces';
import type {
  ChainResult,
  CreateOrderInput,
  CreatePhaseInputInput,
  CreatePhaseNestedInput,
  CreateRecipeWithPhasesInput,
  UpdatePhaseInput,
  IncidentResponse,
  ListIncidentsFilters,
  ListOrdersFilters,
  OrderDetailResponse,
  OrderListItemResponse,
  RecipeDetailResponse,
  UpdateRecipeInput,
} from '../interfaces/plant.interfaces';
import { PhaseChainService } from '../service/phase-chain.service';
import { IncidentService } from '../service/incident.service';
import { PlantService } from '../service/plant.service';
import { ProductionOrderPdfService } from '../service/production-order-pdf.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePhaseInputDto } from './dto/create-phase-input.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import { IncidentResponseDto } from './dto/incident.response';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderDetailResponseDto, OrderListItemResponseDto } from './dto/order-detail.response';
import { PauseOrderDto } from './dto/pause-order.dto';
import { QaApproveDto } from './dto/qa-approve.dto';
import { ReorderPhaseItemDto } from './dto/reorder-phases.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { CreatePhaseDto } from './dto/create-recipe.dto';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { RecipeDetailResponseDto } from './dto/recipe-detail.response';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { UpdateWorkstationDto } from './dto/update-workstation.dto';

const SUPERVISOR_ROLES = [
  OperationalRole.SUPERVISOR,
  OperationalRole.MANAGER,
  OperationalRole.OWNER,
] as const;

type MesRequest = Request & { user: MesJwtPayload & { tenantId?: string } };

@ApiTags('plant')
@Controller('plant')
@Public()
@UseGuards(PlantAuthGuard)
@ApiBearerAuth()
export class PlantController {
  constructor(
    private readonly plantService: PlantService,
    private readonly phaseChainService: PhaseChainService,
    private readonly incidentService: IncidentService,
    private readonly productionOrderPdfService: ProductionOrderPdfService,
  ) {}

  /** MES JWT carries tenantId; platform login uses x-tenant-id on existing plant routes. */
  private resolveTenantId(req: MesRequest): string {
    const fromJwt = req.user?.tenantId;
    if (typeof fromJwt === 'string' && fromJwt.trim()) {
      return fromJwt.trim();
    }
    const header = req.headers['x-tenant-id'];
    if (typeof header === 'string' && header.trim()) {
      return header.trim();
    }
    throw new UnauthorizedException('Tenant is required (JWT tenantId or x-tenant-id header)');
  }

  // ── Workstations ─────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a work station' })
  @ApiCreatedResponse({ description: 'Work station created' })
  @Post('workstations')
  @HttpCode(HttpStatus.CREATED)
  createWorkStation(
    @Req() req: MesRequest,
    @Body() dto: CreateWorkstationDto,
  ): Promise<WorkStation> {
    return this.plantService.createWorkStation(this.resolveTenantId(req), dto);
  }

  @ApiOperation({ summary: 'List work stations' })
  @ApiOkResponse({ description: 'Array of work stations' })
  @Get('workstations')
  findAllWorkStations(@Req() req: MesRequest): Promise<WorkStation[]> {
    return this.plantService.findAllWorkStations(this.resolveTenantId(req));
  }

  @ApiOperation({ summary: 'Update a work station' })
  @ApiParam({ name: 'id', description: 'Work station ID' })
  @ApiOkResponse({ description: 'Work station updated' })
  @Patch('workstations/:id')
  updateWorkStation(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: UpdateWorkstationDto,
  ): Promise<WorkStation> {
    return this.plantService.updateWorkStation(this.resolveTenantId(req), id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a work station' })
  @ApiParam({ name: 'id', description: 'Work station ID' })
  @ApiOkResponse({ description: 'Work station deactivated' })
  @Delete('workstations/:id')
  softDeleteWorkStation(@Req() req: MesRequest, @Param('id') id: string): Promise<WorkStation> {
    return this.plantService.softDeleteWorkStation(this.resolveTenantId(req), id);
  }

  // ── Recipes ──────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a production recipe with phases and inputs' })
  @ApiCreatedResponse({ description: 'Recipe created' })
  @Post('recipes')
  @HttpCode(HttpStatus.CREATED)
  createRecipe(@Req() req: MesRequest, @Body() dto: CreateRecipeDto): Promise<ProductionRecipe> {
    return this.plantService.createRecipe(this.resolveTenantId(req), this.toCreateRecipeInput(dto));
  }

  @ApiOperation({ summary: 'List production recipes' })
  @ApiOkResponse({ description: 'Array of recipes' })
  @Get('recipes')
  findAllRecipes(@Req() req: MesRequest): Promise<ProductionRecipe[]> {
    return this.plantService.findAllRecipes(this.resolveTenantId(req));
  }

  @ApiOperation({ summary: 'Reorder phases for a recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiNoContentResponse({ description: 'Phases reordered' })
  @Patch('recipes/:id/phases/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorderPhases(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body(new ParseArrayPipe({ items: ReorderPhaseItemDto }))
    items: ReorderPhaseItemDto[],
  ): Promise<void> {
    return this.plantService.reorderPhases(this.resolveTenantId(req), id, items);
  }

  @ApiOperation({ summary: 'Add a phase to an existing recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiCreatedResponse({ description: 'Phase created' })
  @Post('recipes/:id/phases')
  @HttpCode(HttpStatus.CREATED)
  createRecipePhase(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: CreatePhaseDto,
  ): Promise<ProductionPhase> {
    return this.plantService.createPhaseOnRecipe(
      this.resolveTenantId(req),
      id,
      this.toCreatePhaseNestedInput(dto),
    );
  }

  @ApiOperation({ summary: 'Update a production phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiOkResponse({ description: 'Phase updated' })
  @Patch('phases/:id')
  updatePhase(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePhaseDto,
  ): Promise<ProductionPhase> {
    return this.plantService.updatePhase(
      this.resolveTenantId(req),
      id,
      this.toUpdatePhaseInput(dto),
    );
  }

  @ApiOperation({ summary: 'Delete a production phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiNoContentResponse({ description: 'Phase deleted' })
  @Delete('phases/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePhase(@Req() req: MesRequest, @Param('id') id: string): Promise<void> {
    return this.plantService.deletePhase(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Clone a production recipe' })
  @ApiParam({ name: 'id', description: 'Source recipe ID' })
  @ApiCreatedResponse({ description: 'Recipe cloned' })
  @Post('recipes/:id/clone')
  @HttpCode(HttpStatus.CREATED)
  cloneRecipe(@Req() req: MesRequest, @Param('id') id: string): Promise<ProductionRecipe> {
    return this.plantService.cloneRecipe(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Get recipe detail with phases, inputs, and total standard minutes' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiOkResponse({ type: RecipeDetailResponseDto })
  @Get('recipes/:id')
  findRecipeById(@Req() req: MesRequest, @Param('id') id: string): Promise<RecipeDetailResponse> {
    return this.plantService.findRecipeById(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Update production recipe metadata' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiOkResponse({ description: 'Recipe updated' })
  @Patch('recipes/:id')
  updateRecipe(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<ProductionRecipe> {
    return this.plantService.updateRecipe(
      this.resolveTenantId(req),
      id,
      this.toUpdateRecipeInput(dto),
    );
  }

  @ApiOperation({ summary: 'Soft-delete a production recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiOkResponse({ description: 'Recipe deactivated' })
  @Delete('recipes/:id')
  softDeleteRecipe(@Req() req: MesRequest, @Param('id') id: string): Promise<ProductionRecipe> {
    return this.plantService.softDeleteRecipe(this.resolveTenantId(req), id);
  }

  // ── Phase inputs ─────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Add an input to a production phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiCreatedResponse({ description: 'Phase input created' })
  @Post('phases/:id/inputs')
  @HttpCode(HttpStatus.CREATED)
  addPhaseInput(
    @Req() req: MesRequest,
    @Param('id') phaseId: string,
    @Body() dto: CreatePhaseInputDto,
  ): Promise<PhaseInput> {
    return this.plantService.addPhaseInput(
      this.resolveTenantId(req),
      phaseId,
      this.toCreatePhaseInputInput(dto),
    );
  }

  @ApiOperation({ summary: 'Remove an input from a production phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiParam({ name: 'inputId', description: 'Phase input ID' })
  @ApiOkResponse({ description: 'Phase input removed' })
  @Delete('phases/:id/inputs/:inputId')
  removePhaseInput(
    @Req() req: MesRequest,
    @Param('id') phaseId: string,
    @Param('inputId') inputId: string,
  ): Promise<PhaseInput> {
    return this.plantService.removePhaseInput(this.resolveTenantId(req), phaseId, inputId);
  }

  // ── Production orders ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a production order with phase executions' })
  @ApiCreatedResponse({ type: OrderDetailResponseDto })
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  createOrder(@Req() req: MesRequest, @Body() dto: CreateOrderDto): Promise<OrderDetailResponse> {
    return this.plantService.createOrder(this.resolveTenantId(req), this.toCreateOrderInput(dto));
  }

  @ApiOperation({ summary: 'List production orders' })
  @ApiOkResponse({ type: [OrderListItemResponseDto] })
  @Get('orders')
  findOrders(
    @Req() req: MesRequest,
    @Query() query: ListOrdersQueryDto,
  ): Promise<OrderListItemResponse[]> {
    return this.plantService.findOrders(this.resolveTenantId(req), this.toListOrdersFilters(query));
  }

  @ApiOperation({ summary: 'Get production order detail' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Get('orders/:id')
  findOrderById(@Req() req: MesRequest, @Param('id') id: string): Promise<OrderDetailResponse> {
    return this.plantService.findOrderById(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Download production order PDF document' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @Get('orders/:id/pdf')
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  async downloadOrderPdf(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(req);
    const { buffer, number } = await this.productionOrderPdfService.buildPdf(tenantId, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="OP-${number}.pdf"`);
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Plan a draft production order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Patch('orders/:id/plan')
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  planOrder(@Req() req: MesRequest, @Param('id') id: string): Promise<OrderDetailResponse> {
    return this.plantService.planOrder(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Pause an in-process production order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/pause')
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  pauseOrder(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: PauseOrderDto,
  ): Promise<OrderDetailResponse> {
    return this.plantService.pauseOrder(this.resolveTenantId(req), id, dto);
  }

  @ApiOperation({ summary: 'Resume a paused production order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/resume')
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  resumeOrder(@Req() req: MesRequest, @Param('id') id: string): Promise<OrderDetailResponse> {
    return this.plantService.resumeOrder(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Cancel a production order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/cancel')
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  cancelOrder(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ): Promise<OrderDetailResponse> {
    return this.plantService.cancelOrder(this.resolveTenantId(req), id, dto, req.user.sub);
  }

  @ApiOperation({ summary: 'Supervisor QA approval for a completed phase execution' })
  @ApiParam({ name: 'id', description: 'Phase execution ID' })
  @ApiOkResponse({ description: 'QA approved; next QA_PENDING execution promoted to READY' })
  @Post('executions/:id/qa-approve')
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  qaApproveExecution(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: QaApproveDto,
  ): Promise<ChainResult> {
    return this.phaseChainService.qaApproveExecution(
      this.resolveTenantId(req),
      id,
      req.user.sub,
      dto,
    );
  }

  // ── Incidents ────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Report a manual production incident' })
  @ApiCreatedResponse({ type: IncidentResponseDto })
  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  createIncident(
    @Req() req: MesRequest,
    @Body() dto: CreateIncidentDto,
  ): Promise<IncidentResponse> {
    return this.incidentService.createIncident(this.resolveTenantId(req), req.user.sub, {
      workStationId: dto.workStationId,
      executionId: dto.executionId ?? null,
      orderId: dto.orderId ?? null,
      type: dto.type,
      severity: dto.severity,
      description: dto.description,
      photoUrl: dto.photoUrl ?? null,
    });
  }

  @ApiOperation({ summary: 'List production incidents (supervisor+)' })
  @ApiOkResponse({ type: [IncidentResponseDto] })
  @Get('incidents')
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  listIncidents(
    @Req() req: MesRequest,
    @Query() query: ListIncidentsQueryDto,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<IncidentResponse[]> {
    return this.incidentService.listIncidents(
      this.resolveTenantId(req),
      this.toListIncidentsFilters(query),
      {
        limit: limit !== undefined ? Number(limit) : undefined,
        offset: offset !== undefined ? Number(offset) : undefined,
      },
    );
  }

  @ApiOperation({ summary: 'Resolve a production incident (supervisor+)' })
  @ApiParam({ name: 'id', description: 'Incident ID' })
  @ApiOkResponse({ type: IncidentResponseDto })
  @Patch('incidents/:id/resolve')
  @UseGuards(PlantAuthGuard, MesRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  resolveIncident(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: ResolveIncidentDto,
  ): Promise<IncidentResponse> {
    return this.incidentService.resolveIncident(this.resolveTenantId(req), id, req.user.sub, dto);
  }

  // ── DTO mappers (decimal strings → Prisma Decimal) ───────────────────────────

  private toCreateRecipeInput(dto: CreateRecipeDto): CreateRecipeWithPhasesInput {
    return {
      name: dto.name,
      categoryId: dto.categoryId,
      finishedProductId: dto.finishedProductId,
      batchSize: new Decimal(dto.batchSize),
      batchUnit: dto.batchUnit,
      packageWeight:
        dto.packageWeight != null && dto.packageWeight !== ''
          ? new Decimal(dto.packageWeight)
          : null,
      estimatedMinutes: dto.estimatedMinutes,
      notes: dto.notes ?? null,
      isActive: dto.isActive,
      phases: dto.phases.map((phase) => this.toCreatePhaseNestedInput(phase)),
    };
  }

  private toCreatePhaseNestedInput(dto: CreatePhaseDto): CreatePhaseNestedInput {
    return {
      order: dto.order,
      name: dto.name,
      description: dto.description ?? null,
      workStationId: dto.workStationId,
      standardMinutes: dto.standardMinutes,
      minOperators: dto.minOperators,
      maxOperators: dto.maxOperators,
      requiresQA: dto.requiresQA,
      inputs: dto.inputs?.map((input) => ({
        supplyItemId: input.supplyItemId,
        quantityPerBatch: new Decimal(input.quantityPerBatch),
        unit: input.unit,
        isOptional: input.isOptional,
      })),
    };
  }

  private toUpdatePhaseInput(dto: UpdatePhaseDto): UpdatePhaseInput {
    return {
      order: dto.order,
      name: dto.name,
      description: dto.description,
      workStationId: dto.workStationId,
      standardMinutes: dto.standardMinutes,
      minOperators: dto.minOperators,
      maxOperators: dto.maxOperators,
      requiresQA: dto.requiresQA,
      inputs: dto.inputs?.map((input) => ({
        supplyItemId: input.supplyItemId,
        quantityPerBatch: new Decimal(input.quantityPerBatch),
        unit: input.unit,
        isOptional: input.isOptional,
      })),
    };
  }

  private toUpdateRecipeInput(dto: UpdateRecipeDto): UpdateRecipeInput {
    return {
      name: dto.name,
      categoryId: dto.categoryId,
      finishedProductId: dto.finishedProductId,
      batchSize: dto.batchSize !== undefined ? new Decimal(dto.batchSize) : undefined,
      batchUnit: dto.batchUnit,
      packageWeight:
        dto.packageWeight === undefined
          ? undefined
          : dto.packageWeight === null || dto.packageWeight === ''
            ? null
            : new Decimal(dto.packageWeight),
      estimatedMinutes: dto.estimatedMinutes,
      notes: dto.notes,
      isActive: dto.isActive,
    };
  }

  private toCreatePhaseInputInput(dto: CreatePhaseInputDto): CreatePhaseInputInput {
    return {
      supplyItemId: dto.supplyItemId,
      quantityPerBatch: new Decimal(dto.quantityPerBatch),
      unit: dto.unit,
      isOptional: dto.isOptional,
    };
  }

  private toCreateOrderInput(dto: CreateOrderDto): CreateOrderInput {
    return {
      recipeId: dto.recipeId,
      batchCount: dto.batchCount,
      shift: dto.shift,
      priority: dto.priority,
      plannedStartAt: new Date(dto.plannedStartAt),
      plannedEndAt: new Date(dto.plannedEndAt),
      supervisorId: dto.supervisorId ?? null,
      notes: dto.notes ?? null,
    };
  }

  private toListOrdersFilters(query: ListOrdersQueryDto): ListOrdersFilters {
    return {
      status: query.status,
      shift: query.shift,
      priority: query.priority,
      plannedStartFrom: query.plannedStartFrom ? new Date(query.plannedStartFrom) : undefined,
      plannedStartTo: query.plannedStartTo ? new Date(query.plannedStartTo) : undefined,
    };
  }

  private toListIncidentsFilters(query: ListIncidentsQueryDto): ListIncidentsFilters {
    return {
      orderId: query.orderId,
      workStationId: query.workStationId,
      type: query.type,
      severity: query.severity,
      resolved: query.resolved,
    };
  }
}
