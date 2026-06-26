import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
  StockUnit,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { mapBatchDisplayUnitToStockUnit } from '../utils/recipe-form.utils';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PlantAuthGuard } from '../guards/plant-auth.guard';
import { PlantRolesGuard } from '../guards/plant-roles.guard';
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
import type {
  CommitteeDetailResponse,
  CommitteeListItemResponse,
  CreateCommitteeInput,
  EligibleCommitteeMemberResponse,
  ListCommitteesFilters,
  UpdateCommitteeInput,
} from '../interfaces/committee.interfaces';
import { CommitteeService } from '../service/committee.service';
import { OperatorOrderRuntimeService } from '../service/operator-order-runtime.service';
import { PhaseChainService } from '../service/phase-chain.service';
import { IncidentService } from '../service/incident.service';
import { PlantService } from '../service/plant.service';
import { ProductionOrderPdfService } from '../service/production-order-pdf.service';
import { SupervisorService } from '../service/supervisor.service';
import {
  CommitteeDetailResponseDto,
  CommitteeListItemResponseDto,
  EligibleCommitteeMemberResponseDto,
} from './dto/committee.response';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import { ListCommitteesQueryDto } from './dto/list-committees-query.dto';
import { UpdateCommitteeDto } from './dto/update-committee.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CompleteStepDto } from './dto/complete-step.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePhaseInputDto } from './dto/create-phase-input.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RejectRecipeDto } from './dto/reject-recipe.dto';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import { FinishOrderDto } from './dto/finish-order.dto';
import { IncidentResponseDto } from './dto/incident.response';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OperatorPauseOrderDto } from './dto/operator-pause-order.dto';
import { OrderDetailResponseDto, OrderListItemResponseDto } from './dto/order-detail.response';
import { OrderRecipeViewResponseDto } from './dto/order-recipe-view.response';
import { PauseOrderDto } from './dto/pause-order.dto';
import { QaApproveDto } from './dto/qa-approve.dto';
import { ReorderPhaseItemDto } from './dto/reorder-phases.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { CreatePhaseDto } from './dto/create-recipe.dto';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { CreateNoveltyDto, mapNoveltyType, mapNoveltySeverity } from './dto/create-novelty.dto';
import { RecipeDetailResponseDto } from './dto/recipe-detail.response';
import { StartOrderDto } from './dto/start-order.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { UpdateWorkstationDto } from './dto/update-workstation.dto';
import {
  SupervisorOverviewResponseDto,
  SupervisorStationsResponseDto,
} from './dto/supervisor.response';

const SUPERVISOR_ROLES = [
  OperationalRole.SUPERVISOR,
  OperationalRole.MANAGER,
  OperationalRole.OWNER,
] as const;

const RECIPE_EDITOR_ROLES = [
  OperationalRole.OWNER,
  OperationalRole.SUPERVISOR,
  OperationalRole.MANAGER,
  OperationalRole.OPERATOR,
] as const;

/** Roles allowed for operational plant actions (pause, resume, novelties).
 *  Includes OPERATOR so OPERATIONS_ADMIN (mapped via PlantRolesGuard) gets access. */
const OPERATIONAL_ROLES = [
  OperationalRole.OWNER,
  OperationalRole.SUPERVISOR,
  OperationalRole.MANAGER,
  OperationalRole.OPERATOR,
] as const;

const OPERATOR_ROLES = [OperationalRole.OPERATOR] as const;

type MesRequest = Request & { user: MesJwtPayload & { tenantId?: string } };

@ApiTags('plant')
@Controller('plant')
@Public()
@UseGuards(PlantAuthGuard)
@ApiBearerAuth()
export class PlantController {
  constructor(
    private readonly plantService: PlantService,
    private readonly committeeService: CommitteeService,
    private readonly phaseChainService: PhaseChainService,
    private readonly incidentService: IncidentService,
    private readonly productionOrderPdfService: ProductionOrderPdfService,
    private readonly supervisorService: SupervisorService,
    private readonly operatorOrderRuntimeService: OperatorOrderRuntimeService,
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

  // ── Supervisor dashboard ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Supervisor plant map overview (KPIs, live stations, incidents)' })
  @ApiOkResponse({ type: SupervisorOverviewResponseDto })
  @Get('supervisor/overview')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  getSupervisorOverview(@Req() req: MesRequest) {
    return this.supervisorService.getOverview(this.resolveTenantId(req));
  }

  @ApiOperation({ summary: 'Supervisor stations master list with assigned recipes/phases' })
  @ApiOkResponse({ type: SupervisorStationsResponseDto })
  @Get('supervisor/stations')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  getSupervisorStations(@Req() req: MesRequest) {
    return this.supervisorService.getStations(this.resolveTenantId(req));
  }

  @ApiOperation({ summary: 'Supervisor live station detail for plant map side panel' })
  @ApiParam({ name: 'id', description: 'Work station ID' })
  @ApiOkResponse({ type: Object })
  @Get('supervisor/stations/:id/live')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  getSupervisorStationLive(@Req() req: MesRequest, @Param('id') id: string) {
    return this.supervisorService.getStationLiveDetail(this.resolveTenantId(req), id);
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
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...RECIPE_EDITOR_ROLES)
  createRecipe(@Req() req: MesRequest, @Body() dto: CreateRecipeDto): Promise<ProductionRecipe> {
    return this.plantService.createRecipe(this.resolveTenantId(req), {
      ...this.toCreateRecipeInput(dto),
      actorUserId: req.user?.sub ?? null,
    });
  }

  @ApiOperation({ summary: 'Preview next recipe code for a category' })
  @Get('recipes/next-code')
  previewNextRecipeCode(
    @Req() req: MesRequest,
    @Query('categoryId') categoryId: string,
  ): Promise<{ code: string }> {
    return this.plantService
      .previewNextRecipeCode(this.resolveTenantId(req), categoryId)
      .then((code) => ({ code }));
  }

  @ApiOperation({ summary: 'Approve a recipe (supervisor)' })
  @Patch('recipes/:id/approve')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  approveRecipe(@Req() req: MesRequest, @Param('id') id: string): Promise<ProductionRecipe> {
    return this.plantService.approveRecipe(this.resolveTenantId(req), id, req.user?.sub ?? null);
  }

  @ApiOperation({ summary: 'Reject a recipe (supervisor)' })
  @Patch('recipes/:id/reject')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  rejectRecipe(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: RejectRecipeDto,
  ): Promise<ProductionRecipe> {
    return this.plantService.rejectRecipe(
      this.resolveTenantId(req),
      id,
      dto.reason,
      req.user?.sub ?? null,
    );
  }

  @ApiOperation({ summary: 'Recipe lifecycle status history' })
  @Get('recipes/:id/status-history')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  getRecipeStatusHistory(@Req() req: MesRequest, @Param('id') id: string) {
    return this.plantService.getRecipeStatusHistory(this.resolveTenantId(req), id);
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

  // ── Production committees ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a production committee' })
  @ApiCreatedResponse({ type: CommitteeDetailResponseDto })
  @Post('committees')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  createCommittee(
    @Req() req: MesRequest,
    @Body() dto: CreateCommitteeDto,
  ): Promise<CommitteeDetailResponse> {
    return this.committeeService.createCommittee(
      this.resolveTenantId(req),
      this.toCreateCommitteeInput(dto),
    );
  }

  @ApiOperation({ summary: 'List production committees' })
  @ApiOkResponse({ type: [CommitteeListItemResponseDto] })
  @Get('committees')
  findCommittees(
    @Req() req: MesRequest,
    @Query() query: ListCommitteesQueryDto,
  ): Promise<CommitteeListItemResponse[]> {
    return this.committeeService.listCommittees(
      this.resolveTenantId(req),
      this.toListCommitteesFilters(query),
    );
  }

  @ApiOperation({ summary: 'List users eligible as committee members (OPERATIONS_ADMIN)' })
  @ApiOkResponse({ type: [EligibleCommitteeMemberResponseDto] })
  @Get('committees/eligible-members')
  findEligibleCommitteeMembers(@Req() req: MesRequest): Promise<EligibleCommitteeMemberResponse[]> {
    return this.committeeService.listEligibleMembers(this.resolveTenantId(req));
  }

  @ApiOperation({ summary: 'Get production committee detail' })
  @ApiParam({ name: 'id', description: 'Production committee ID' })
  @ApiOkResponse({ type: CommitteeDetailResponseDto })
  @Get('committees/:id')
  findCommitteeById(
    @Req() req: MesRequest,
    @Param('id') id: string,
  ): Promise<CommitteeDetailResponse> {
    return this.committeeService.getCommitteeDetail(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Update a production committee' })
  @ApiParam({ name: 'id', description: 'Production committee ID' })
  @ApiOkResponse({ type: CommitteeDetailResponseDto })
  @Patch('committees/:id')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  updateCommittee(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCommitteeDto,
  ): Promise<CommitteeDetailResponse> {
    return this.committeeService.updateCommittee(
      this.resolveTenantId(req),
      id,
      this.toUpdateCommitteeInput(dto),
    );
  }

  @ApiOperation({ summary: 'Close an active production committee' })
  @ApiParam({ name: 'id', description: 'Production committee ID' })
  @ApiOkResponse({ type: CommitteeDetailResponseDto })
  @Post('committees/:id/close')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  closeCommittee(
    @Req() req: MesRequest,
    @Param('id') id: string,
  ): Promise<CommitteeDetailResponse> {
    return this.committeeService.closeCommittee(this.resolveTenantId(req), id);
  }

  // ── Production orders ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a production order with phase executions' })
  @ApiCreatedResponse({ type: OrderDetailResponseDto })
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
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

  @ApiOperation({
    summary: 'List novelties (incidents) for a specific production order (PLT-05 alias)',
  })
  @ApiOkResponse({ type: [IncidentResponseDto] })
  @Get('orders/:id/incidents')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
  listOrderNovelties(
    @Req() req: MesRequest,
    @Param('id') orderId: string,
    @Query('resolved') resolved?: string,
  ): Promise<IncidentResponse[]> {
    return this.incidentService.listIncidents(this.resolveTenantId(req), {
      orderId,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
    });
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
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
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
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  planOrder(@Req() req: MesRequest, @Param('id') id: string): Promise<OrderDetailResponse> {
    return this.plantService.planOrder(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Pause an in-process production order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/pause')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
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
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
  resumeOrder(@Req() req: MesRequest, @Param('id') id: string): Promise<OrderDetailResponse> {
    return this.plantService.resumeOrder(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Cancel a production order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/cancel')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  cancelOrder(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ): Promise<OrderDetailResponse> {
    return this.plantService.cancelOrder(this.resolveTenantId(req), id, dto, req.user.sub);
  }

  @ApiOperation({ summary: 'Get production order recipe view for operator tablet' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderRecipeViewResponseDto })
  @Get('orders/:id/recipe')
  getOrderRecipeView(@Req() req: MesRequest, @Param('id') id: string) {
    return this.operatorOrderRuntimeService.getOrderRecipeView(this.resolveTenantId(req), id);
  }

  @ApiOperation({ summary: 'Start a planned production order (operator)' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/start')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
  startOrder(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: StartOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.operatorOrderRuntimeService.startOrder(
      this.resolveTenantId(req),
      id,
      { operatorUserId: req.user.sub, idempotencyKey },
      dto,
    );
  }

  @ApiOperation({ summary: 'Pause an in-process production order (operator)' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/operator/pause')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
  pauseOrderByOperator(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: OperatorPauseOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.operatorOrderRuntimeService.pauseOrderByOperator(
      this.resolveTenantId(req),
      id,
      { operatorUserId: req.user.sub, idempotencyKey },
      dto,
    );
  }

  @ApiOperation({ summary: 'Resume a paused production order (operator)' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/operator/resume')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
  resumeOrderByOperator(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.operatorOrderRuntimeService.resumeOrderByOperator(this.resolveTenantId(req), id, {
      operatorUserId: req.user.sub,
      idempotencyKey,
    });
  }

  @ApiOperation({ summary: 'Complete the current production step (operator)' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/complete-step')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
  completeStep(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: CompleteStepDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.operatorOrderRuntimeService.completeStep(
      this.resolveTenantId(req),
      id,
      { operatorUserId: req.user.sub, idempotencyKey },
      dto,
    );
  }

  @ApiOperation({ summary: 'Finish a production order after all steps are completed' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiOkResponse({ type: OrderDetailResponseDto })
  @Post('orders/:id/finish')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
  finishOrder(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: FinishOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.operatorOrderRuntimeService.finishOrder(
      this.resolveTenantId(req),
      id,
      { operatorUserId: req.user.sub, idempotencyKey },
      dto,
    );
  }

  @ApiOperation({ summary: 'Supervisor QA approval for a completed phase execution' })
  @ApiParam({ name: 'id', description: 'Phase execution ID' })
  @ApiOkResponse({ description: 'QA approved; next QA_PENDING execution promoted to READY' })
  @Post('executions/:id/qa-approve')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
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
      locationId: dto.locationId ?? null,
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
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
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
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...SUPERVISOR_ROLES)
  resolveIncident(
    @Req() req: MesRequest,
    @Param('id') id: string,
    @Body() dto: ResolveIncidentDto,
  ): Promise<IncidentResponse> {
    return this.incidentService.resolveIncident(this.resolveTenantId(req), id, req.user.sub, dto);
  }

  // ── Alias endpoints PLT-05 (novelties) ──────────────────────────────────────

  @ApiOperation({ summary: 'Report a novelty for a specific production order (PLT-05 alias)' })
  @ApiCreatedResponse({ type: IncidentResponseDto })
  @Post('orders/:id/incidents')
  @HttpCode(HttpStatus.CREATED)
  createOrderNovelty(
    @Req() req: MesRequest,
    @Param('id') orderId: string,
    @Body() dto: CreateNoveltyDto,
  ): Promise<IncidentResponse> {
    return this.incidentService.createIncident(this.resolveTenantId(req), req.user.sub, {
      workStationId: dto.workStationId,
      locationId: dto.locationId ?? null,
      executionId: dto.stepId ?? null,
      orderId,
      type: mapNoveltyType(dto.noveltyType),
      severity: mapNoveltySeverity(dto.severity),
      description: dto.description,
      photoUrl: dto.photoUrl ?? null,
      requiresPause: dto.requiresPause,
    });
  }

  @ApiOperation({ summary: 'List incidents by location (PLT-05 alias)' })
  @ApiOkResponse({ type: [IncidentResponseDto] })
  @Get('locations/:id/incidents')
  @UseGuards(PlantAuthGuard, PlantRolesGuard)
  @Roles(...OPERATIONAL_ROLES)
  listLocationNovelties(
    @Req() req: MesRequest,
    @Param('id') locationId: string,
    @Query('status') status?: string,
  ): Promise<IncidentResponse[]> {
    return this.incidentService.listIncidents(this.resolveTenantId(req), {
      locationId,
      resolved: status === 'OPEN' ? false : undefined,
    });
  }

  // ── DTO mappers (decimal strings → Prisma Decimal) ───────────────────────────

  private toCreateRecipeInput(dto: CreateRecipeDto): CreateRecipeWithPhasesInput {
    const batchUnit =
      dto.batchUnit ??
      (dto.batchDisplayUnit
        ? mapBatchDisplayUnitToStockUnit(dto.batchDisplayUnit)
        : StockUnit.UNIT);

    return {
      name: dto.name,
      categoryId: dto.categoryId,
      recipeType: dto.recipeType ?? 'FINAL_PRODUCT',
      finishedProductId: dto.finishedProductId ?? null,
      batchSize: dto.batchSize ? new Decimal(dto.batchSize) : new Decimal(1),
      batchUnit,
      batchDisplayUnit: dto.batchDisplayUnit ?? null,
      packageWeight:
        dto.packageWeight != null && dto.packageWeight !== ''
          ? new Decimal(dto.packageWeight)
          : null,
      packageWeightGrams: dto.packageWeightGrams ?? null,
      expectedYield:
        dto.expectedYield != null && dto.expectedYield !== ''
          ? new Decimal(dto.expectedYield)
          : null,
      expectedYieldUnit: dto.expectedYieldUnit ?? null,
      estimatedMinutes: dto.estimatedMinutes ?? 0,
      operationCenter: dto.operationCenter ?? 'PLANT',
      locationIds: dto.locationIds,
      technicalResponsible: dto.technicalResponsible ?? 'CHEF',
      allergens: dto.allergens ?? [],
      notes: dto.notes ?? null,
      isDraft: dto.isDraft ?? false,
      phases: (dto.phases ?? []).map((phase) => this.toCreatePhaseNestedInput(phase)),
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
    const batchUnit =
      dto.batchUnit ??
      (dto.batchDisplayUnit ? mapBatchDisplayUnitToStockUnit(dto.batchDisplayUnit) : undefined);

    return {
      name: dto.name,
      categoryId: dto.categoryId,
      recipeType: dto.recipeType,
      finishedProductId: dto.finishedProductId,
      batchSize: dto.batchSize !== undefined ? new Decimal(dto.batchSize) : undefined,
      batchUnit,
      batchDisplayUnit: dto.batchDisplayUnit,
      packageWeight:
        dto.packageWeight === undefined
          ? undefined
          : dto.packageWeight === null || dto.packageWeight === ''
            ? null
            : new Decimal(dto.packageWeight),
      packageWeightGrams: dto.packageWeightGrams,
      expectedYield:
        dto.expectedYield === undefined
          ? undefined
          : dto.expectedYield === ''
            ? null
            : new Decimal(dto.expectedYield),
      expectedYieldUnit: dto.expectedYieldUnit,
      estimatedMinutes: dto.estimatedMinutes,
      operationCenter: dto.operationCenter,
      locationIds: dto.locationIds,
      technicalResponsible: dto.technicalResponsible,
      allergens: dto.allergens,
      notes: dto.notes,
      isActive: dto.isActive,
      isDraft: dto.isDraft,
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
      committeeId: dto.committeeId ?? null,
    };
  }

  private toCreateCommitteeInput(dto: CreateCommitteeDto): CreateCommitteeInput {
    return {
      memberUserIds: dto.memberUserIds,
      status: dto.status,
    };
  }

  private toUpdateCommitteeInput(dto: UpdateCommitteeDto): UpdateCommitteeInput {
    return {
      status: dto.status,
      memberUserIds: dto.memberUserIds,
    };
  }

  private toListCommitteesFilters(query: ListCommitteesQueryDto): ListCommitteesFilters {
    return {
      status: query.status,
      page: query.page,
      limit: query.limit,
    };
  }

  private toListOrdersFilters(query: ListOrdersQueryDto): ListOrdersFilters {
    return {
      status: query.status,
      shift: query.shift,
      priority: query.priority,
      plannedStartFrom: query.plannedStartFrom ? new Date(query.plannedStartFrom) : undefined,
      plannedStartTo: query.plannedStartTo ? new Date(query.plannedStartTo) : undefined,
      committeeId: query.committeeId,
    };
  }

  private toListIncidentsFilters(query: ListIncidentsQueryDto): ListIncidentsFilters {
    return {
      orderId: query.orderId,
      workStationId: query.workStationId,
      locationId: query.locationId,
      type: query.type,
      severity: query.severity,
      resolved: query.resolved,
    };
  }
}
