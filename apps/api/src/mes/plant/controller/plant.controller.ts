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
  Req,
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
import type { PhaseInput, ProductionRecipe, WorkStation } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { Request } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { MesJwtGuard } from '../../auth/guards/mes-jwt.guard';
import type { MesJwtPayload } from '../../auth/interfaces/mes-auth.interfaces';
import type {
  CreatePhaseInputInput,
  CreateRecipeWithPhasesInput,
  RecipeDetailResponse,
  UpdateRecipeInput,
} from '../interfaces/plant.interfaces';
import { PlantService } from '../service/plant.service';
import { CreatePhaseInputDto } from './dto/create-phase-input.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import { ReorderPhaseItemDto } from './dto/reorder-phases.dto';
import { RecipeDetailResponseDto } from './dto/recipe-detail.response';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { UpdateWorkstationDto } from './dto/update-workstation.dto';

type MesRequest = Request & { user: MesJwtPayload };

@ApiTags('plant')
@Controller('plant')
@Public()
@UseGuards(MesJwtGuard)
@ApiBearerAuth()
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  // ── Workstations ─────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a work station' })
  @ApiCreatedResponse({ description: 'Work station created' })
  @Post('workstations')
  @HttpCode(HttpStatus.CREATED)
  createWorkStation(
    @Req() req: MesRequest,
    @Body() dto: CreateWorkstationDto,
  ): Promise<WorkStation> {
    return this.plantService.createWorkStation(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'List work stations' })
  @ApiOkResponse({ description: 'Array of work stations' })
  @Get('workstations')
  findAllWorkStations(@Req() req: MesRequest): Promise<WorkStation[]> {
    return this.plantService.findAllWorkStations(req.user.tenantId);
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
    return this.plantService.updateWorkStation(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a work station' })
  @ApiParam({ name: 'id', description: 'Work station ID' })
  @ApiOkResponse({ description: 'Work station deactivated' })
  @Delete('workstations/:id')
  softDeleteWorkStation(@Req() req: MesRequest, @Param('id') id: string): Promise<WorkStation> {
    return this.plantService.softDeleteWorkStation(req.user.tenantId, id);
  }

  // ── Recipes ──────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a production recipe with phases and inputs' })
  @ApiCreatedResponse({ description: 'Recipe created' })
  @Post('recipes')
  @HttpCode(HttpStatus.CREATED)
  createRecipe(@Req() req: MesRequest, @Body() dto: CreateRecipeDto): Promise<ProductionRecipe> {
    return this.plantService.createRecipe(req.user.tenantId, this.toCreateRecipeInput(dto));
  }

  @ApiOperation({ summary: 'List production recipes' })
  @ApiOkResponse({ description: 'Array of recipes' })
  @Get('recipes')
  findAllRecipes(@Req() req: MesRequest): Promise<ProductionRecipe[]> {
    return this.plantService.findAllRecipes(req.user.tenantId);
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
    return this.plantService.reorderPhases(req.user.tenantId, id, items);
  }

  @ApiOperation({ summary: 'Clone a production recipe' })
  @ApiParam({ name: 'id', description: 'Source recipe ID' })
  @ApiCreatedResponse({ description: 'Recipe cloned' })
  @Post('recipes/:id/clone')
  @HttpCode(HttpStatus.CREATED)
  cloneRecipe(@Req() req: MesRequest, @Param('id') id: string): Promise<ProductionRecipe> {
    return this.plantService.cloneRecipe(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get recipe detail with phases, inputs, and total standard minutes' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiOkResponse({ type: RecipeDetailResponseDto })
  @Get('recipes/:id')
  findRecipeById(@Req() req: MesRequest, @Param('id') id: string): Promise<RecipeDetailResponse> {
    return this.plantService.findRecipeById(req.user.tenantId, id);
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
    return this.plantService.updateRecipe(req.user.tenantId, id, this.toUpdateRecipeInput(dto));
  }

  @ApiOperation({ summary: 'Soft-delete a production recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiOkResponse({ description: 'Recipe deactivated' })
  @Delete('recipes/:id')
  softDeleteRecipe(@Req() req: MesRequest, @Param('id') id: string): Promise<ProductionRecipe> {
    return this.plantService.softDeleteRecipe(req.user.tenantId, id);
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
      req.user.tenantId,
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
    return this.plantService.removePhaseInput(req.user.tenantId, phaseId, inputId);
  }

  // ── DTO mappers (decimal strings → Prisma Decimal) ───────────────────────────

  private toCreateRecipeInput(dto: CreateRecipeDto): CreateRecipeWithPhasesInput {
    return {
      name: dto.name,
      finishedProductId: dto.finishedProductId,
      batchSize: new Decimal(dto.batchSize),
      batchUnit: dto.batchUnit,
      estimatedMinutes: dto.estimatedMinutes,
      notes: dto.notes ?? null,
      phases: dto.phases.map((phase) => ({
        order: phase.order,
        name: phase.name,
        description: phase.description ?? null,
        workStationId: phase.workStationId,
        standardMinutes: phase.standardMinutes,
        minOperators: phase.minOperators,
        maxOperators: phase.maxOperators,
        requiresQA: phase.requiresQA,
        inputs: phase.inputs?.map((input) => ({
          supplyItemId: input.supplyItemId,
          quantityPerBatch: new Decimal(input.quantityPerBatch),
          unit: input.unit,
          isOptional: input.isOptional,
        })),
      })),
    };
  }

  private toUpdateRecipeInput(dto: UpdateRecipeDto): UpdateRecipeInput {
    return {
      name: dto.name,
      finishedProductId: dto.finishedProductId,
      batchSize: dto.batchSize !== undefined ? new Decimal(dto.batchSize) : undefined,
      batchUnit: dto.batchUnit,
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
}
