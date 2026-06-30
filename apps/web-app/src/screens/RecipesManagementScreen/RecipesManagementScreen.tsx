import {
  RecetaActionButton,
  RecetaFilterSelect,
  RecetaMetricCard,
  RecetaRecipeWizard,
  type RecetaRecipeWizardStepId,
  RecetaResultButton,
  RecetaSearch,
  RecetaTableHeader,
  type RecetaTableColumn,
  RecetaUtilityButton,
  toast,
} from '@restopsiq/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approvePlantRecipe,
  getRecipeStatusHistory,
  previewNextRecipeCode,
  rejectPlantRecipe,
  updatePlantRecipe,
} from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';
import type {
  BatchDisplayUnit,
  OperationCenter,
  RecipeAllergen,
  RecipeLifecycleStatus,
  RecipeType,
  TechnicalResponsible,
} from '@/api/plant/types';

import { RecipeImagesManager } from '@/components/recetas/RecipeImagesManager';
import { RecipeReferencePhotoField } from '@/components/recetas/RecipeReferencePhotoField';
import { RecipeCompositionTable } from '@/components/recetas/RecipeCompositionTable';
import { RecipePhaseAccordion } from '@/components/recetas/RecipePhaseAccordion';
import { HistoryResponsiveList } from '@/components/recetas/HistoryResponsiveList';
import { ProcessListCard } from '@/components/recetas/ProcessListCard';
import { ProcessListRow } from '@/components/recetas/ProcessListRow';
import { RecipeListCard } from '@/components/recetas/RecipeListCard';
import { RecipeListResponsiveRow } from '@/components/recetas/RecipeListResponsiveRow';
import { ResponsiveTable } from '@/components/responsive-table';
import type {
  ProcessRow,
  RecipeCompositionRow,
  RecipeFormGeneralValues,
  RecipeListItem,
  RecipeListStatusFilter,
  RecipePhaseFormRow,
} from '@/features/recetas/types';
import {
  BATCH_DISPLAY_UNIT_OPTIONS,
  getAllergenLabels,
  getBatchDisplayUnitLabel,
  getOperationCenterLabel,
  getRecipeTypeLabel,
  getTechnicalResponsibleLabel,
  LIFECYCLE_STATUS_LABELS,
  OPERATION_CENTER_OPTIONS,
  parseEstimatedTotalMinutes,
  RECIPE_ALLERGEN_OPTIONS,
  RECIPE_TYPE_OPTIONS,
  splitEstimatedMinutes,
  TECHNICAL_RESPONSIBLE_OPTIONS,
} from '@/features/recetas/types';
import {
  formatBatchSizeForApi,
  formatExpectedYieldForApi,
  mapBatchDisplayUnitToStockUnit,
  validateRecipeFormDraft,
  validateRecipeFormGeneral,
} from '@/features/recetas/validation/recipeForm.schema';
import { validateRecipeCompositionRows } from '@/features/recetas/validation/recipeComposition.schema';
import { validateRecipePhaseRows } from '@/features/recetas/validation/recipePhases.schema';
import {
  buildBatchWeightWarning,
  calculateTotalNetGrams,
  createEmptyCompositionRow,
  duplicateCompositionRow,
  formatCompositionTotalLabel,
  mapCompositionRowsToApi,
  mapPlantCompositionToRow,
} from '@/features/recetas/mappers/composition.mapper';
import {
  createEmptyPhaseRow,
  mapFormRowsToSyncInput,
  mapPlantPhasesToFormRows,
  reorderPhaseRows,
} from '@/features/recetas/mappers/phases.mapper';
import { PROCESS_RESPONSIVE_COLUMNS } from '@/features/recetas/process-columns';
import {
  RECIPE_LIST_RESPONSIVE_COLUMNS,
  recetaTableColumnsForVisible,
} from '@/features/recetas/recipe-list-columns';
import { addRecipeImage, uploadRecipeImageFile } from '@/features/recetas/api/recipe-images.api';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import {
  useEditorSupplyItems,
  usePlantProcess,
  usePlantRecipeDetail,
  usePlantRecipes,
  usePlantWorkstations,
  useRecipeCategories,
  useSavePlantRecipe,
} from '@/features/recetas/hooks';
import { formatRecipeCode } from '@/features/recetas/mappers/recipes.mapper';
import type { RecetaResult, RecetaStatus } from '@/features/recetas/types';

import styles from './RecipesManagementScreen.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

type RecipesView = 'list' | 'process' | 'history';
type RecipeListSortKey = 'nombre' | 'tiempo' | 'fases';

const WIZARD_STEP_ORDER: RecetaRecipeWizardStepId[] = ['general', 'composition', 'phases'];

const processStatsInitial = {
  total: 0,
  validated: 0,
  inProgress: 0,
  failed: 0,
  health: 0,
};

interface HistoryRow {
  value: string;
  code: string;
  recipeName: string;
  operatorName: string;
  date: string;
  progress: string;
  result: RecetaResult;
  validationsOk: number;
  validationsFailed: number;
  duration: string;
  observations: string;
  phases: Array<{ title: string; note: string; duration: string }>;
}

/** Sin API de historial en plant — datos de demostración como antes. */
const historyRowsSeed: HistoryRow[] = [
  {
    value: 'EX-001',
    code: 'EX-001',
    recipeName: 'Lomo de Cerdo al Carbon',
    operatorName: 'Carlos Mendez',
    date: '25 de may, 08:36 a. m.',
    progress: '6/6',
    result: 'ok',
    validationsOk: 12,
    validationsFailed: 0,
    duration: '47 / 45 min',
    observations: 'Ejecucion exitosa sin incidentes',
    phases: [
      { title: 'Preparacion', note: 'Sin novedades', duration: '14 min' },
      { title: 'Marinado', note: 'Sin novedades', duration: '28 min' },
      { title: 'Coccion', note: 'Sin novedades', duration: '5 min' },
    ],
  },
  {
    value: 'EX-002',
    code: 'EX-002',
    recipeName: 'Costillas BBQ',
    operatorName: 'Ana Rojas',
    date: '25 de may, 10:15 a. m.',
    progress: '7/8',
    result: 'warning',
    validationsOk: 14,
    validationsFailed: 2,
    duration: '68 / 60 min',
    observations: 'Tiempo de coccion excedido en 8 minutos',
    phases: [
      { title: 'Preparacion', note: 'Sin novedades', duration: '12 min' },
      { title: 'Coccion', note: 'Excedio tiempo', duration: '56 min' },
    ],
  },
  {
    value: 'EX-003',
    code: 'EX-003',
    recipeName: 'Flan de Caramelo',
    operatorName: 'Maria Torres',
    date: '25 de may, 02:06 p. m.',
    progress: '3/5',
    result: 'failed',
    validationsOk: 5,
    validationsFailed: 3,
    duration: '45 / 90 min',
    observations: 'Validacion de temperatura fallida en fase de horneado',
    phases: [{ title: 'Horneado', note: 'Temp. insuficiente', duration: '45 min' }],
  },
];

const recipeListTableColumns: RecetaTableColumn[] = [
  { key: 'id', label: 'ID', width: '88px' },
  {
    key: 'nombre',
    label: 'Nombre',
    width: 'minmax(180px, 1.35fr)',
    sortable: true,
  },
  { key: 'categoria', label: 'Categoría', width: 'minmax(120px, 0.9fr)' },
  { key: 'tiempo', label: 'Tiempo Est.', width: '112px', sortable: true },
  { key: 'fases', label: 'Fases', width: '72px', align: 'center', sortable: true },
  { key: 'version', label: 'Versión', width: '72px' },
  { key: 'estado', label: 'Estado', width: '108px', align: 'center' },
  { key: 'acciones', label: 'Acciones', width: '72px', align: 'right' },
];

const processTableColumns: RecetaTableColumn[] = [
  { key: 'id', label: 'ID Receta', width: '96px' },
  { key: 'nombre', label: 'Nombre', width: 'minmax(0, 1.15fr)' },
  { key: 'categoria', label: 'Categoria', width: 'minmax(96px, 0.85fr)' },
  { key: 'fases', label: 'Fases', width: '64px', align: 'center' },
  { key: 'duracion', label: 'Duracion', width: '88px' },
  { key: 'estado', label: 'Estado Proceso', width: '136px' },
  { key: 'ultima', label: 'Ultima validacion', width: 'minmax(112px, 1fr)' },
  { key: 'salud', label: 'Salud ejecucion', width: 'minmax(120px, 1fr)' },
  { key: 'acciones', label: 'Acciones', width: '128px', align: 'right' },
];

interface RecipesManagementScreenProps {
  view?: RecipesView;
}

export function RecipesManagementScreen({
  view = 'list',
}: RecipesManagementScreenProps): React.JSX.Element {
  const theme = useUiTheme();
  const [currentView, setCurrentView] = useState<RecipesView>(view);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<RecipeListStatusFilter>('all');
  const [recipeSort, setRecipeSort] = useState<{
    key: RecipeListSortKey;
    direction: 'asc' | 'desc';
  }>({ key: 'nombre', direction: 'asc' });

  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeEditorOpen, setRecipeEditorOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<RecetaRecipeWizardStepId>('general');
  const [maxReachedWizardStep, setMaxReachedWizardStep] =
    useState<RecetaRecipeWizardStepId>('general');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [batchSize, setBatchSize] = useState('1');
  const [batchDisplayUnit, setBatchDisplayUnit] = useState<BatchDisplayUnit | ''>('KILOGRAM');
  const [packageWeightGrams, setPackageWeightGrams] = useState('');
  const [expectedYield, setExpectedYield] = useState('');
  const [expectedYieldUnit, setExpectedYieldUnit] = useState('porciones');
  const [estimatedHours, setEstimatedHours] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [recipeType, setRecipeType] = useState<RecipeType | ''>('FINAL_PRODUCT');
  const [operationCenter, setOperationCenter] = useState<OperationCenter | ''>('PLANT');
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [technicalResponsible, setTechnicalResponsible] = useState<TechnicalResponsible | ''>(
    'CHEF',
  );
  const [allergens, setAllergens] = useState<RecipeAllergen[]>([]);
  const [lifecycleStatus, setLifecycleStatus] = useState<RecipeLifecycleStatus>('TRIAL');
  const [createdAtLabel, setCreatedAtLabel] = useState('Se asignará al guardar');
  const [previewCode, setPreviewCode] = useState('');
  const [referencePhotoFile, setReferencePhotoFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [rejectReason, setRejectReason] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [phases, setPhases] = useState<RecipePhaseFormRow[]>([]);
  const [compositionRows, setCompositionRows] = useState<RecipeCompositionRow[]>([]);
  const [compositionFieldErrors, setCompositionFieldErrors] = useState<Record<string, string>>({});
  const [phaseFieldErrors, setPhaseFieldErrors] = useState<Record<string, string>>({});
  const [finishedProductId, setFinishedProductId] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [togglingRecipeId, setTogglingRecipeId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const [persistedPhaseIds, setPersistedPhaseIds] = useState<string[]>([]);

  const historyRows = historyRowsSeed;
  const historyStats = {
    total: historyRows.length,
    success: historyRows.filter((r) => r.result === 'ok').length,
    warning: historyRows.filter((r) => r.result === 'warning').length,
    failed: historyRows.filter((r) => r.result === 'failed').length,
  };
  const isListOrEditor = currentView === 'list' || recipeEditorOpen;
  const isEditor = recipeEditorOpen;

  const recipesQuery = usePlantRecipes(isListOrEditor);
  const processQuery = usePlantProcess(currentView === 'process');
  const supplyItemsQuery = useEditorSupplyItems(isEditor);
  const recipeCategoriesQuery = useRecipeCategories('active', isEditor);
  const workstationsQuery = usePlantWorkstations(isEditor);
  const locationsQuery = useLocations();
  const recipeDetailQuery = usePlantRecipeDetail(editingRecipeId);
  const previewCodeQuery = useQuery({
    queryKey: [...plantKeys.all, 'recipe-next-code', categoryId],
    queryFn: () => previewNextRecipeCode(categoryId),
    enabled: isEditor && !editingRecipeId && Boolean(categoryId),
  });
  const statusHistoryQuery = useQuery({
    queryKey: [...plantKeys.all, 'recipe-status-history', editingRecipeId],
    queryFn: () => getRecipeStatusHistory(editingRecipeId!),
    enabled: Boolean(editingRecipeId) && recipeEditorOpen,
  });
  const saveRecipeMutation = useSavePlantRecipe();
  const saving = saveRecipeMutation.isPending;
  const approveRecipeMutation = useMutation({
    mutationFn: (id: string) => approvePlantRecipe(id),
    onSuccess: (recipe) => {
      setLifecycleStatus(recipe.lifecycleStatus);
      void queryClient.invalidateQueries({ queryKey: plantKeys.all });
      toast.success(`Receta aprobada. Estado: ${LIFECYCLE_STATUS_LABELS[recipe.lifecycleStatus]}`);
    },
    onError: (error) => {
      setSaveError(error instanceof Error ? error.message : 'No se pudo aprobar la receta');
    },
  });
  const rejectRecipeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPlantRecipe(id, reason),
    onSuccess: (recipe) => {
      setLifecycleStatus(recipe.lifecycleStatus);
      setRejectReason('');
      void queryClient.invalidateQueries({ queryKey: plantKeys.all });
      toast.success('Receta rechazada correctamente');
    },
    onError: (error) => {
      setSaveError(error instanceof Error ? error.message : 'No se pudo rechazar la receta');
    },
  });
  const toggleRecipeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updatePlantRecipe(id, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plantKeys.all });
      setTogglingRecipeId(null);
    },
    onError: () => {
      setTogglingRecipeId(null);
    },
  });

  const recipes = recipesQuery.data ?? [];
  const processRows = processQuery.data?.rows ?? [];
  const processStats = processQuery.data?.stats ?? processStatsInitial;
  const supplyItems = supplyItemsQuery.data ?? [];
  const recipeCategories = recipeCategoriesQuery.data ?? [];
  const workStations = workstationsQuery.data ?? [];
  const locations = useMemo(
    () => (locationsQuery.data ?? []).filter((location) => location.isActive),
    [locationsQuery.data],
  );

  useEffect(() => {
    if (!isEditor || editingRecipeId) {
      return;
    }
    if (previewCodeQuery.data?.code) {
      setPreviewCode(previewCodeQuery.data.code);
    } else if (!categoryId) {
      setPreviewCode('');
    }
  }, [isEditor, editingRecipeId, previewCodeQuery.data, categoryId]);

  const loadError = useMemo(() => {
    const activeError = currentView === 'process' ? processQuery.error : recipesQuery.error;
    if (!activeError) {
      return null;
    }
    return activeError instanceof Error ? activeError.message : 'Error al cargar recetas';
  }, [currentView, processQuery.error, recipesQuery.error]);

  const editorLoading =
    isEditor &&
    (supplyItemsQuery.isLoading ||
      recipeCategoriesQuery.isLoading ||
      workstationsQuery.isLoading ||
      locationsQuery.isLoading ||
      (Boolean(editingRecipeId) && recipeDetailQuery.isLoading));

  const estimatedMinutesValue = useMemo(
    () => parseEstimatedTotalMinutes(estimatedHours, estimatedMinutes),
    [estimatedHours, estimatedMinutes],
  );
  const totalMinutes = useMemo(
    () => phases.reduce((sum, phase) => sum + Math.max(0, phase.standardMinutes), 0),
    [phases],
  );
  const phasesTimeWarning = useMemo(() => {
    if (estimatedMinutesValue <= 0) {
      return null;
    }
    const diff = Math.abs(totalMinutes - estimatedMinutesValue);
    const threshold = Math.max(15, Math.round(estimatedMinutesValue * 0.1));
    if (diff <= threshold) {
      return null;
    }
    return `El tiempo total de fases (${totalMinutes} min) difiere del tiempo estimado del paso 1 (${estimatedMinutesValue} min).`;
  }, [estimatedMinutesValue, totalMinutes]);

  const compositionReadOnly = lifecycleStatus === 'INACTIVE';
  const phasesReadOnly = compositionReadOnly;
  const compositionTotalNetGrams = useMemo(
    () => calculateTotalNetGrams(compositionRows),
    [compositionRows],
  );
  const compositionTotalNetLabel = useMemo(
    () => formatCompositionTotalLabel(compositionTotalNetGrams),
    [compositionTotalNetGrams],
  );
  const compositionBatchWeightWarning = useMemo(
    () => buildBatchWeightWarning(compositionTotalNetGrams, packageWeightGrams),
    [compositionTotalNetGrams, packageWeightGrams],
  );

  useEffect(() => {
    setCurrentView(view);
  }, [view]);

  useEffect(() => {
    if (!isEditor || editingRecipeId) {
      return;
    }
    if (supplyItems.length > 0) {
      setFinishedProductId((prev) => prev || supplyItems[0]?.id || '');
    }
  }, [isEditor, editingRecipeId, supplyItems]);

  useEffect(() => {
    if (operationCenter !== 'LOCATION' && locationIds.length > 0) {
      setLocationIds([]);
    }
  }, [operationCenter, locationIds.length]);

  useEffect(() => {
    if (!editingRecipeId || !recipeDetailQuery.data) {
      return;
    }

    const detail = recipeDetailQuery.data;
    setName(detail.name);
    setNotes(detail.notes ?? '');
    setFinishedProductId(detail.finishedProductId ?? '');
    setBatchSize(String(detail.batchSize));
    setBatchDisplayUnit(detail.batchDisplayUnit ?? 'KILOGRAM');
    setPackageWeightGrams(detail.packageWeightGrams ? String(detail.packageWeightGrams) : '');
    setExpectedYield(detail.expectedYield ?? '');
    setExpectedYieldUnit(detail.expectedYieldUnit ?? 'porciones');
    const timeParts = splitEstimatedMinutes(detail.estimatedMinutes);
    setEstimatedHours(timeParts.hours);
    setEstimatedMinutes(timeParts.minutes);
    setLifecycleStatus(detail.lifecycleStatus ?? 'TRIAL');
    setCategoryId(detail.categoryId ?? '');
    setRecipeType(detail.recipeType ?? 'FINAL_PRODUCT');
    setOperationCenter(detail.operationCenter ?? 'PLANT');
    setLocationIds(detail.locationIds ?? []);
    setTechnicalResponsible(detail.technicalResponsible ?? 'CHEF');
    setAllergens(detail.allergens ?? []);
    setCreatedAtLabel(
      new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(detail.createdAt)),
    );
    const mappedComposition = (detail.composition ?? [])
      .map(mapPlantCompositionToRow)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    setCompositionRows(mappedComposition);
    setPhases(mapPlantPhasesToFormRows(detail.phases, mappedComposition));
    setPersistedPhaseIds(detail.phases.map((phase) => phase.id));
    setCompositionFieldErrors({});
    setPhaseFieldErrors({});
  }, [editingRecipeId, recipeDetailQuery.data]);

  useEffect(() => {
    if (!editingRecipeId || !recipeDetailQuery.isError) {
      return;
    }
    setSaveError(
      recipeDetailQuery.error instanceof Error
        ? recipeDetailQuery.error.message
        : 'No se pudo cargar la receta',
    );
    setRecipeEditorOpen(false);
    setEditingRecipeId(null);
  }, [editingRecipeId, recipeDetailQuery.isError, recipeDetailQuery.error]);

  useEffect(() => {
    if (!isEditor) {
      return;
    }
    const resourceError = supplyItemsQuery.error ?? workstationsQuery.error;
    if (!resourceError) {
      return;
    }
    setSaveError(
      resourceError instanceof Error
        ? resourceError.message
        : 'No se pudieron cargar insumos o estaciones',
    );
  }, [isEditor, supplyItemsQuery.error, workstationsQuery.error]);

  const handleRecipeSortChange = useCallback((columnKey: string) => {
    if (columnKey !== 'nombre' && columnKey !== 'tiempo' && columnKey !== 'fases') {
      return;
    }
    const key = columnKey as RecipeListSortKey;
    setRecipeSort((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const recipeListTableColumnsWithSort = useMemo(
    () =>
      recipeListTableColumns.map((column) => {
        if (!column.sortable) {
          return column;
        }
        const active = recipeSort.key === column.key;
        return {
          ...column,
          active,
          sortDirection: active ? recipeSort.direction : null,
          onSort: () => handleRecipeSortChange(column.key),
        };
      }),
    [handleRecipeSortChange, recipeSort],
  );

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchSearch = recipe.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'trial' && recipe.lifecycleStatus === 'TRIAL') ||
        (statusFilter === 'active' && recipe.lifecycleStatus === 'ACTIVE') ||
        (statusFilter === 'inactive' && recipe.lifecycleStatus === 'INACTIVE');
      return matchSearch && matchCategory && matchStatus;
    });
  }, [recipes, search, categoryFilter, statusFilter]);

  const sortedFilteredRecipes = useMemo(() => {
    const sorted = [...filteredRecipes];
    sorted.sort((left, right) => {
      let comparison = 0;
      switch (recipeSort.key) {
        case 'nombre':
          comparison = left.name.localeCompare(right.name, 'es', { sensitivity: 'base' });
          break;
        case 'tiempo':
          comparison = left.durationMin - right.durationMin;
          break;
        case 'fases':
          comparison = left.phases - right.phases;
          break;
        default:
          return 0;
      }
      return recipeSort.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredRecipes, recipeSort]);

  const filteredProcessRows = useMemo(() => {
    return processRows.filter((row) => {
      const term = search.toLowerCase();
      const matchSearch =
        row.name.toLowerCase().includes(term) || row.code.toLowerCase().includes(term);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && row.result === 'ok') ||
        (statusFilter === 'inactive' && row.result === 'failed');
      return matchSearch && matchStatus;
    });
  }, [processRows, search, statusFilter]);

  const filteredHistoryRows = useMemo(() => {
    return historyRows.filter((row) => {
      const term = search.toLowerCase();
      const matchSearch =
        row.recipeName.toLowerCase().includes(term) ||
        row.operatorName.toLowerCase().includes(term) ||
        row.code.toLowerCase().includes(term);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && row.result === 'ok') ||
        (statusFilter === 'inactive' && row.result === 'failed');
      return matchSearch && matchStatus;
    });
  }, [historyRows, search, statusFilter]);

  const totals = useMemo(() => {
    const total = filteredRecipes.length;
    const active = filteredRecipes.filter((r) => r.lifecycleStatus === 'ACTIVE').length;
    const trial = filteredRecipes.filter((r) => r.lifecycleStatus === 'TRIAL').length;
    return { total, active, trial };
  }, [filteredRecipes]);

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(recipes.map((r) => r.category))].sort();
    return [
      { value: 'all', label: 'Todas las categorias' },
      ...categories.map((value) => ({ value, label: value })),
    ];
  }, [recipes]);
  const recipeStatusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'trial', label: 'Prueba' },
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Inactiva' },
  ];
  const historyStatusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'OK' },
    { value: 'inactive', label: 'Fallo' },
  ];

  const handleFinishedProductChange = (productId: string): void => {
    setFinishedProductId(productId);
  };

  const buildFormValues = (): RecipeFormGeneralValues => ({
    categoryId,
    recipeType,
    name,
    finishedProductId,
    batchSize,
    batchDisplayUnit,
    packageWeightGrams,
    expectedYield,
    expectedYieldUnit,
    estimatedHours,
    estimatedMinutes,
    operationCenter,
    locationIds,
    technicalResponsible,
    allergens,
    notes,
  });

  const handleLocationToggle = (locationId: string, checked: boolean): void => {
    setLocationIds((prev) =>
      checked ? [...prev, locationId] : prev.filter((id) => id !== locationId),
    );
  };

  const handleAllergenToggle = (allergen: RecipeAllergen, checked: boolean): void => {
    setAllergens((prev) =>
      checked ? [...prev, allergen] : prev.filter((value) => value !== allergen),
    );
  };

  const resetWizardNavigation = (): void => {
    setWizardStep('general');
    setMaxReachedWizardStep('general');
  };

  const advanceWizardStep = (step: RecetaRecipeWizardStepId): void => {
    setWizardStep(step);
    const currentMaxIndex = WIZARD_STEP_ORDER.indexOf(maxReachedWizardStep);
    const nextIndex = WIZARD_STEP_ORDER.indexOf(step);
    if (nextIndex > currentMaxIndex) {
      setMaxReachedWizardStep(step);
    }
  };

  const validateGeneralStep = (): boolean => {
    const validation = validateRecipeFormGeneral(buildFormValues());
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setSaveError(validation.message);
      return false;
    }
    setFieldErrors({});
    setSaveError(null);
    return true;
  };

  const validateCompositionStep = (): boolean => {
    const validation = validateRecipeCompositionRows(compositionRows);
    if (!validation.success) {
      setCompositionFieldErrors(validation.fieldErrors ?? {});
      setSaveError(validation.message ?? 'Revisa la composición de la receta');
      return false;
    }
    setCompositionFieldErrors({});
    setSaveError(null);
    return true;
  };

  const validatePhasesStep = (): boolean => {
    const validation = validateRecipePhaseRows(phases);
    if (!validation.success) {
      setPhaseFieldErrors(validation.fieldErrors ?? {});
      setSaveError(validation.message ?? 'Revisa las fases del proceso');
      return false;
    }
    setPhaseFieldErrors({});
    setSaveError(null);
    return true;
  };

  const handleWizardNext = (): void => {
    if (wizardStep === 'general' && validateGeneralStep()) {
      advanceWizardStep('composition');
      return;
    }
    if (wizardStep === 'composition' && validateCompositionStep()) {
      advanceWizardStep('phases');
    }
  };

  const handleWizardPrevious = (): void => {
    const currentIndex = WIZARD_STEP_ORDER.indexOf(wizardStep);
    const previousStep = WIZARD_STEP_ORDER[currentIndex - 1];
    if (previousStep) {
      setSaveError(null);
      setWizardStep(previousStep);
    }
  };

  const handleWizardStepChange = (step: RecetaRecipeWizardStepId): void => {
    if (editingRecipeId) {
      setSaveError(null);
      setWizardStep(step);
      return;
    }

    const targetIndex = WIZARD_STEP_ORDER.indexOf(step);
    const maxIndex = WIZARD_STEP_ORDER.indexOf(maxReachedWizardStep);
    if (targetIndex <= maxIndex) {
      setSaveError(null);
      setWizardStep(step);
    }
  };

  const openNewRecipeEditor = (): void => {
    setEditingRecipeId(null);
    setPersistedPhaseIds([]);
    setName('');
    setNotes('');
    setBatchSize('1');
    setBatchDisplayUnit('KILOGRAM');
    setPackageWeightGrams('');
    setExpectedYield('');
    setExpectedYieldUnit('porciones');
    setEstimatedHours('0');
    setEstimatedMinutes('30');
    setLifecycleStatus('TRIAL');
    setCategoryId('');
    setRecipeType('FINAL_PRODUCT');
    setOperationCenter('PLANT');
    setLocationIds([]);
    setTechnicalResponsible('CHEF');
    setAllergens([]);
    setCreatedAtLabel('Se asignará al guardar');
    setPreviewCode('');
    setReferencePhotoFile(null);
    setFieldErrors({});
    setRejectReason('');
    setPhases([]);
    setCompositionRows([]);
    setCompositionFieldErrors({});
    setPhaseFieldErrors({});
    setFinishedProductId('');
    setSaveError(null);
    resetWizardNavigation();
    setRecipeEditorOpen(true);
  };

  const openEditRecipeEditor = (recipeId: string): void => {
    setSaveError(null);
    setWizardStep('general');
    setMaxReachedWizardStep('phases');
    setEditingRecipeId(recipeId);
    setRecipeEditorOpen(true);
  };

  const handleToggleRecipeStatus = (recipe: RecipeListItem): void => {
    setTogglingRecipeId(recipe.id);
    toggleRecipeMutation.mutate({
      id: recipe.id,
      isActive: recipe.status !== 'active',
    });
  };

  const handleDiscardEditor = (): void => {
    setSaveError(null);
    resetWizardNavigation();
    setRecipeEditorOpen(false);
    setEditingRecipeId(null);
  };

  const handleSaveDraft = (): void => {
    const validation = validateRecipeFormDraft({ categoryId, name, notes });
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setSaveError(validation.message);
      return;
    }

    setSaveError(null);
    setFieldErrors({});

    saveRecipeMutation.mutate(
      {
        mode: 'create',
        payload: {
          categoryId,
          name: name.trim(),
          notes: notes.trim() || undefined,
          isDraft: true,
        },
      },
      {
        onSuccess: (recipe) => {
          const code = 'code' in recipe ? recipe.code : null;
          toast.success(
            code
              ? `Borrador guardado correctamente. Código: ${code}`
              : 'Borrador guardado correctamente',
          );
          setEditingRecipeId(null);
          resetWizardNavigation();
          setRecipeEditorOpen(false);
        },
        onError: (error) => {
          setSaveError(error instanceof Error ? error.message : 'No se pudo guardar el borrador');
        },
      },
    );
  };

  const uploadReferencePhoto = async (recipeId: string, file: File): Promise<void> => {
    const upload = await uploadRecipeImageFile(recipeId, file);
    if (!upload.publicUrl) {
      throw new Error('No se pudo obtener la URL pública de la imagen');
    }
    await addRecipeImage({
      recipeId,
      nameImage: upload.originalName,
      url: upload.publicUrl,
      storageObjectId: upload.id,
    });
  };

  const buildGeneralRecipePayload = () => {
    const estimatedMinutesValue = parseEstimatedTotalMinutes(estimatedHours, estimatedMinutes);
    const resolvedBatchDisplayUnit = batchDisplayUnit as BatchDisplayUnit;

    return {
      name: name.trim(),
      categoryId,
      recipeType: recipeType as RecipeType,
      finishedProductId,
      batchSize: formatBatchSizeForApi(batchSize),
      batchUnit: mapBatchDisplayUnitToStockUnit(resolvedBatchDisplayUnit),
      batchDisplayUnit: resolvedBatchDisplayUnit,
      packageWeightGrams: Number.parseInt(packageWeightGrams, 10),
      expectedYield: formatExpectedYieldForApi(expectedYield),
      expectedYieldUnit: expectedYieldUnit.trim(),
      estimatedMinutes: estimatedMinutesValue,
      operationCenter: operationCenter as OperationCenter,
      locationIds: operationCenter === 'LOCATION' ? locationIds : undefined,
      technicalResponsible: technicalResponsible as TechnicalResponsible,
      allergens,
      notes: notes.trim() || undefined,
    };
  };

  const handleSaveRecipe = async (): Promise<void> => {
    if (editingRecipeId) {
      if (wizardStep === 'general') {
        if (!validateGeneralStep()) {
          return;
        }

        setSaveError(null);
        saveRecipeMutation.mutate(
          {
            mode: 'update',
            recipeId: editingRecipeId,
            scope: 'general',
            payload: buildGeneralRecipePayload(),
          },
          {
            onSuccess: () => {
              toast.success('Datos generales actualizados');
              handleDiscardEditor();
            },
            onError: (error) => {
              setSaveError(
                error instanceof Error
                  ? error.message
                  : 'No se pudieron guardar los datos generales',
              );
            },
          },
        );
        return;
      }

      if (wizardStep === 'composition') {
        if (!validateCompositionStep()) {
          return;
        }

        setSaveError(null);
        saveRecipeMutation.mutate(
          {
            mode: 'update',
            recipeId: editingRecipeId,
            scope: 'composition',
            payload: {
              composition: mapCompositionRowsToApi(compositionRows),
            },
          },
          {
            onSuccess: () => {
              toast.success('Composición actualizada');
              handleDiscardEditor();
            },
            onError: (error) => {
              setSaveError(
                error instanceof Error ? error.message : 'No se pudo guardar la composición',
              );
            },
          },
        );
        return;
      }

      const defaultWorkStationId = workStations[0]?.id ?? '';
      if (!defaultWorkStationId) {
        setSaveError('No hay estaciones de trabajo configuradas. Ejecuta el seed de planta.');
        return;
      }

      if (!validatePhasesStep()) {
        return;
      }

      const syncPhases = mapFormRowsToSyncInput(phases, compositionRows, defaultWorkStationId);
      setSaveError(null);
      saveRecipeMutation.mutate(
        {
          mode: 'update',
          recipeId: editingRecipeId,
          scope: 'phases',
          phases: syncPhases,
          originalPhaseIds: persistedPhaseIds,
        },
        {
          onSuccess: () => {
            toast.success('Fases actualizadas');
            handleDiscardEditor();
          },
          onError: (error) => {
            setSaveError(
              error instanceof Error ? error.message : 'No se pudieron guardar las fases',
            );
          },
        },
      );
      return;
    }

    const formValues = buildFormValues();
    const generalValidation = validateRecipeFormGeneral(formValues);
    if (!generalValidation.success) {
      setFieldErrors(generalValidation.fieldErrors);
      setSaveError(generalValidation.message);
      return;
    }

    if (!validateCompositionStep()) {
      return;
    }

    if (!validatePhasesStep()) {
      return;
    }

    const defaultWorkStationId = workStations[0]?.id ?? '';
    if (!defaultWorkStationId) {
      setSaveError('No hay estaciones de trabajo configuradas. Ejecuta el seed de planta.');
      return;
    }

    const syncPhases = mapFormRowsToSyncInput(phases, compositionRows, defaultWorkStationId);

    setSaveError(null);
    setFieldErrors({});

    const recipePayload = {
      ...buildGeneralRecipePayload(),
      composition: mapCompositionRowsToApi(compositionRows),
    };

    saveRecipeMutation.mutate(
      {
        mode: 'create',
        payload: {
          ...recipePayload,
          phases: syncPhases.map((phase, index) => ({
            order: index + 1,
            name: phase.title.trim() || `Fase ${index + 1}`,
            description: phase.description.trim() || undefined,
            workStationId: phase.workStationId,
            standardMinutes: Math.max(1, phase.durationMin),
            requiresQA: phase.validations.length > 0,
            inputs: phase.ingredients
              .filter((ingredient) => ingredient.supplyItemId)
              .map((ingredient) => ({
                supplyItemId: ingredient.supplyItemId,
                quantityPerBatch: ingredient.quantityPerBatch.replace(',', '.'),
                unit: ingredient.unit,
              })),
          })),
        },
      },
      {
        onSuccess: async (result) => {
          const recipeId = 'id' in result && typeof result.id === 'string' ? result.id : null;

          if (referencePhotoFile && recipeId) {
            try {
              await uploadReferencePhoto(recipeId, referencePhotoFile);
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'La receta se guardó, pero falló la foto de referencia',
              );
            }
          }

          const savedCode =
            result && 'code' in result && result.code ? result.code : previewCode || '';
          toast.success(
            savedCode
              ? `Receta creada correctamente. Código: ${savedCode}`
              : 'Receta creada correctamente',
          );

          setEditingRecipeId(null);
          resetWizardNavigation();
          setRecipeEditorOpen(false);
        },
        onError: (error) => {
          setSaveError(error instanceof Error ? error.message : 'No se pudo guardar la receta');
        },
      },
    );
  };

  const handleAddCompositionRow = (): void => {
    setCompositionRows((prev) => [...prev, createEmptyCompositionRow(prev.length)]);
  };

  const handleRemoveCompositionRow = (rowId: string): void => {
    const row = compositionRows.find((item) => item.id === rowId);
    if (row?.persisted && editingRecipeId) {
      const confirmed = window.confirm(
        '¿Eliminar este componente de la composición? Este cambio se guardará al actualizar la receta.',
      );
      if (!confirmed) {
        return;
      }
    }
    setCompositionRows((prev) =>
      prev
        .filter((item) => item.id !== rowId)
        .map((item, index) => ({ ...item, sortOrder: index })),
    );
  };

  const handleDuplicateCompositionRow = (rowId: string): void => {
    const row = compositionRows.find((item) => item.id === rowId);
    if (!row) {
      return;
    }
    setCompositionRows((prev) => [...prev, duplicateCompositionRow(row, prev.length)]);
  };

  const handleMoveCompositionRow = (rowId: string, direction: 'up' | 'down'): void => {
    setCompositionRows((prev) => {
      const index = prev.findIndex((item) => item.id === rowId);
      if (index < 0) {
        return prev;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((item, sortOrder) => ({ ...item, sortOrder }));
    });
  };

  const handleAddPhaseRow = (): void => {
    setSaveError(null);
    setPhases((prev) =>
      reorderPhaseRows([
        ...prev.map((row) => ({ ...row, expanded: false })),
        createEmptyPhaseRow(prev.length + 1),
      ]),
    );
  };

  const handleRemovePhaseRow = (rowId: string): void => {
    const target = phases.find((row) => row.id === rowId);
    if (
      target?.persisted &&
      !window.confirm('¿Eliminar esta fase de la receta? Esta acción no se puede deshacer.')
    ) {
      return;
    }
    setPhases((prev) => reorderPhaseRows(prev.filter((row) => row.id !== rowId)));
  };

  const handleMovePhaseRow = (rowId: string, direction: 'up' | 'down'): void => {
    setPhases((prev) => {
      const index = prev.findIndex((row) => row.id === rowId);
      if (index === -1) {
        return prev;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return reorderPhaseRows(next);
    });
  };

  const renderMainContent = (): React.JSX.Element => {
    if (currentView === 'process') {
      return (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderMain}>
              <h1>Control de procesos</h1>
              <p>Monitoreo de estado y validación de recetas</p>
            </div>
          </header>
          <section className={[styles.metricsRow, styles.metricsRowFive].join(' ')}>
            <RecetaMetricCard
              theme={theme}
              variant="type-1"
              title="Total recetas"
              value={processStats.total}
              size="xl"
            />
            <RecetaMetricCard
              theme={theme}
              variant="type-2"
              title="Validadas"
              value={processStats.validated}
              size="xl"
            />
            <RecetaMetricCard
              theme={theme}
              variant="type-2"
              title="En progreso"
              value={processStats.inProgress}
              size="xl"
            />
            <RecetaMetricCard
              theme={theme}
              variant="type-3"
              title="Con fallas"
              value={processStats.failed}
              size="xl"
            />
            <RecetaMetricCard
              theme={theme}
              variant="type-1"
              title="Salud prom."
              value={`${processStats.health}%`}
              size="xl"
            />
          </section>
          <section className={styles.toolbarRow}>
            <RecetaSearch
              theme={theme}
              size="md"
              value={search}
              onChange={setSearch}
              className={styles.searchGrow}
            />
            <RecetaFilterSelect
              theme={theme}
              size="md"
              className={styles.filterSelect}
              value={statusFilter}
              options={recipeStatusOptions}
              onChange={(value) => setStatusFilter(value as RecipeListStatusFilter)}
            />
          </section>
          <section className={[styles.tableWrap, styles.tableWrapProcess].join(' ')}>
            <ResponsiveTable<ProcessRow>
              columns={PROCESS_RESPONSIVE_COLUMNS}
              rows={filteredProcessRows}
              keyExtractor={(row) => row.recipeId}
              className={styles.recipeListTable}
              renderTableHeader={({ visibleColumns }) => (
                <RecetaTableHeader
                  theme={theme}
                  size="md"
                  className={[styles.tableHead, styles.processTableHead].join(' ')}
                  columns={recetaTableColumnsForVisible(processTableColumns, visibleColumns)}
                />
              )}
              renderTableRow={(row, { visibleColumns, columnsTemplate }) => (
                <ProcessListRow
                  row={row}
                  theme={theme}
                  visibleColumns={visibleColumns}
                  columnsTemplate={columnsTemplate}
                />
              )}
              renderCard={(row) => <ProcessListCard row={row} theme={theme} />}
            />
          </section>
        </>
      );
    }

    if (currentView === 'history') {
      return (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderMain}>
              <h1>Historial de ejecución</h1>
              <p>Trazabilidad de producción y validaciones</p>
            </div>
          </header>
          <section className={[styles.metricsRow, styles.metricsRowFour].join(' ')}>
            <RecetaMetricCard
              theme={theme}
              variant="type-1"
              title="Total ejecuciones"
              value={historyStats.total}
              size="xl"
            />
            <RecetaMetricCard
              theme={theme}
              variant="type-2"
              title="Exitosas"
              value={historyStats.success}
              size="xl"
            />
            <RecetaMetricCard
              theme={theme}
              variant="type-2"
              title="Con advertencias"
              value={historyStats.warning}
              size="xl"
            />
            <RecetaMetricCard
              theme={theme}
              variant="type-3"
              title="Fallidas"
              value={historyStats.failed}
              size="xl"
            />
          </section>
          <section className={styles.toolbarRow}>
            <RecetaSearch
              theme={theme}
              size="md"
              value={search}
              onChange={setSearch}
              className={styles.searchGrow}
              placeholder="Buscar por receta u operador..."
            />
            <RecetaFilterSelect
              theme={theme}
              size="md"
              className={styles.filterSelect}
              value={statusFilter}
              options={historyStatusOptions}
              onChange={(value) => setStatusFilter(value as RecipeListStatusFilter)}
            />
          </section>
          <section className={styles.historyWrap}>
            <HistoryResponsiveList items={filteredHistoryRows} theme={theme} />
          </section>
        </>
      );
    }

    return (
      <>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            <h1>Administración de recetas</h1>
            <p>Gestión y control de recetas de producción</p>
          </div>
          <RecetaActionButton
            theme={theme}
            size="md"
            label="Nueva Receta"
            className={styles.pageHeaderAction}
            onClick={openNewRecipeEditor}
          />
        </header>
        <section className={[styles.metricsRow, styles.metricsRowThree].join(' ')}>
          <RecetaMetricCard
            theme={theme}
            variant="type-1"
            title="Total recetas"
            value={totals.total}
            size="xl"
          />
          <RecetaMetricCard
            theme={theme}
            variant="type-2"
            title="En prueba"
            value={totals.trial}
            size="xl"
          />
          <RecetaMetricCard
            theme={theme}
            variant="type-4"
            title="Activas"
            value={totals.active}
            size="xl"
          />
        </section>
        <section className={[styles.toolbarRow, styles.toolbarRowList].join(' ')}>
          <RecetaSearch
            theme={theme}
            size="md"
            value={search}
            onChange={setSearch}
            className={[styles.searchGrow, styles.searchGrowList].join(' ')}
          />
          <RecetaFilterSelect
            theme={theme}
            size="md"
            className={[styles.filterSelect, styles.filterSelectList].join(' ')}
            value={categoryFilter}
            options={categoryOptions}
            onChange={setCategoryFilter}
          />
          <RecetaFilterSelect
            theme={theme}
            size="md"
            className={[styles.filterSelect, styles.filterSelectList].join(' ')}
            value={statusFilter}
            options={recipeStatusOptions}
            onChange={(value) => setStatusFilter(value as RecipeListStatusFilter)}
          />
        </section>
        <section className={[styles.tableWrap, styles.tableWrapList].join(' ')}>
          <ResponsiveTable<RecipeListItem>
            columns={RECIPE_LIST_RESPONSIVE_COLUMNS}
            rows={sortedFilteredRecipes}
            keyExtractor={(recipe) => recipe.id}
            className={styles.recipeListTable}
            renderTableHeader={({ visibleColumns }) => (
              <RecetaTableHeader
                theme={theme}
                size="md"
                className={[styles.tableHead, styles.listTableHead].join(' ')}
                columns={recetaTableColumnsForVisible(
                  recipeListTableColumnsWithSort,
                  visibleColumns,
                )}
              />
            )}
            renderTableRow={(recipe, { visibleColumns, columnsTemplate }) => (
              <div
                key={recipe.id}
                className={[styles.rowClickable, styles.recipeRowHost].join(' ')}
                onClick={() => openEditRecipeEditor(recipe.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openEditRecipeEditor(recipe.id);
                  }
                }}
              >
                <RecipeListResponsiveRow
                  recipe={recipe}
                  theme={theme}
                  visibleColumns={visibleColumns}
                  columnsTemplate={columnsTemplate}
                  maxDurationMin={Math.max(
                    120,
                    ...sortedFilteredRecipes.map((item) => item.durationMin),
                  )}
                  onEdit={() => openEditRecipeEditor(recipe.id)}
                  onToggleStatus={() => handleToggleRecipeStatus(recipe)}
                  toggleLoading={togglingRecipeId === recipe.id}
                />
              </div>
            )}
            renderCard={(recipe) => (
              <RecipeListCard
                recipe={recipe}
                theme={theme}
                onEdit={() => openEditRecipeEditor(recipe.id)}
                onOpen={() => openEditRecipeEditor(recipe.id)}
                onToggleStatus={() => handleToggleRecipeStatus(recipe)}
                toggleLoading={togglingRecipeId === recipe.id}
              />
            )}
          />
        </section>
      </>
    );
  };

  const editorCode = editingRecipeId
    ? (recipes.find((recipe) => recipe.id === editingRecipeId)?.code ??
      (recipeDetailQuery.data ? formatRecipeCode(recipeDetailQuery.data) : '—'))
    : previewCode || 'Nueva';
  const selectedCategory = recipeCategories.find((category) => category.id === categoryId);
  const selectedProduct = supplyItems.find((item) => item.id === finishedProductId);
  const batchDisplayUnitLabel = getBatchDisplayUnitLabel(
    batchDisplayUnit ? (batchDisplayUnit as BatchDisplayUnit) : null,
  );
  const estimatedTotalMinutes = parseEstimatedTotalMinutes(estimatedHours, estimatedMinutes);
  const selectedLocationLabels = locations
    .filter((location) => locationIds.includes(location.id))
    .map((location) => location.name)
    .join(', ');
  const rejectionReason = recipeDetailQuery.data?.rejectionReason;
  const statusHistory = statusHistoryQuery.data ?? [];

  const supervisorPanel =
    editingRecipeId && wizardStep === 'general' ? (
      <section className={styles.supervisorPanel} aria-label="Aprobación de receta">
        <h3 className={styles.supervisorTitle}>Flujo de aprobación</h3>
        {lifecycleStatus === 'TRIAL' ? (
          <div className={styles.supervisorActions}>
            <button
              type="button"
              className={styles.approveButton}
              disabled={approveRecipeMutation.isPending}
              onClick={() => approveRecipeMutation.mutate(editingRecipeId)}
            >
              {approveRecipeMutation.isPending ? 'Aprobando...' : 'Aprobar receta'}
            </button>
            <div className={styles.rejectBlock}>
              <input
                className={styles.rejectInput}
                type="text"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Motivo de rechazo"
                aria-label="Motivo de rechazo"
              />
              <button
                type="button"
                className={styles.rejectButton}
                disabled={rejectRecipeMutation.isPending || !rejectReason.trim()}
                onClick={() =>
                  rejectRecipeMutation.mutate({
                    id: editingRecipeId,
                    reason: rejectReason.trim(),
                  })
                }
              >
                {rejectRecipeMutation.isPending ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.supervisorHint}>
            Estado actual: <strong>{LIFECYCLE_STATUS_LABELS[lifecycleStatus]}</strong>
            {rejectionReason ? ` · Motivo: ${rejectionReason}` : null}
          </p>
        )}
        {statusHistory.length > 0 ? (
          <ul className={styles.statusHistoryList}>
            {statusHistory.map((entry) => (
              <li key={entry.id}>
                <span>
                  {entry.fromStatus ? LIFECYCLE_STATUS_LABELS[entry.fromStatus] : '—'} →{' '}
                  {LIFECYCLE_STATUS_LABELS[entry.toStatus]}
                </span>
                <span>
                  {new Intl.DateTimeFormat('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(new Date(entry.createdAt))}
                </span>
                {entry.reason ? <span>{entry.reason}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    ) : null;

  const generalExtraContent = (
    <>
      {!editingRecipeId ? (
        <RecipeReferencePhotoField value={referencePhotoFile} onChange={setReferencePhotoFile} />
      ) : (
        <RecipeImagesManager recipeId={editingRecipeId} />
      )}
      {supervisorPanel}
    </>
  );

  return (
    <div className={styles.screen}>
      {loadError ? <p className={styles.loadError}>{loadError}</p> : null}
      <main className={styles.content}>{renderMainContent()}</main>

      <RecetaRecipeWizard
        open={recipeEditorOpen}
        onClose={handleDiscardEditor}
        mode={editingRecipeId ? 'edit' : 'create'}
        code={editorCode}
        currentStep={wizardStep}
        maxReachedStep={maxReachedWizardStep}
        onStepChange={handleWizardStepChange}
        theme={theme}
        loading={editorLoading}
        saving={saving}
        error={saveError}
        onSave={() => void handleSaveRecipe()}
        onNext={handleWizardNext}
        onPrevious={handleWizardPrevious}
        generalStep={{
          name,
          onNameChange: setName,
          categoryId,
          onCategoryChange: setCategoryId,
          categoryOptions: recipeCategories.map((category) => ({
            value: category.id,
            label: category.nombre,
          })),
          categoryLoading: recipeCategoriesQuery.isLoading,
          categoryError:
            recipeCategoriesQuery.isError && recipeCategories.length === 0
              ? 'No se pudieron cargar las categorías'
              : null,
          onRetryCategories: () => void recipeCategoriesQuery.refetch(),
          recipeCode: editingRecipeId ? editorCode : previewCode,
          recipeCodePlaceholder: categoryId ? 'Generando código...' : 'Se generará al guardar',
          recipeType,
          onRecipeTypeChange: (value) => setRecipeType(value as RecipeType | ''),
          recipeTypeOptions: RECIPE_TYPE_OPTIONS,
          finishedProductId,
          onFinishedProductChange: handleFinishedProductChange,
          supplyItemOptions: supplyItems.map((item) => ({
            value: item.id,
            label: `${item.nombre} (${item.codigoInterno})`,
          })),
          batchSize,
          onBatchSizeChange: setBatchSize,
          batchDisplayUnit,
          onBatchDisplayUnitChange: (value) => setBatchDisplayUnit(value as BatchDisplayUnit | ''),
          batchDisplayUnitOptions: BATCH_DISPLAY_UNIT_OPTIONS,
          packageWeightGrams,
          onPackageWeightGramsChange: setPackageWeightGrams,
          expectedYield,
          onExpectedYieldChange: setExpectedYield,
          expectedYieldUnit,
          onExpectedYieldUnitChange: setExpectedYieldUnit,
          estimatedHours,
          onEstimatedHoursChange: setEstimatedHours,
          estimatedMinutes,
          onEstimatedMinutesChange: setEstimatedMinutes,
          lifecycleStatusLabel: LIFECYCLE_STATUS_LABELS[lifecycleStatus],
          operationCenter,
          onOperationCenterChange: (value) => setOperationCenter(value as OperationCenter | ''),
          operationCenterOptions: OPERATION_CENTER_OPTIONS,
          locationIds,
          onLocationToggle: handleLocationToggle,
          locationOptions: locations.map((location) => ({
            value: location.id,
            label: location.name,
          })),
          locationsLoading: locationsQuery.isLoading,
          technicalResponsible,
          onTechnicalResponsibleChange: (value) =>
            setTechnicalResponsible(value as TechnicalResponsible | ''),
          technicalResponsibleOptions: TECHNICAL_RESPONSIBLE_OPTIONS,
          selectedAllergens: allergens,
          onAllergenToggle: (value, checked) =>
            handleAllergenToggle(value as RecipeAllergen, checked),
          allergenOptions: RECIPE_ALLERGEN_OPTIONS,
          createdAtLabel,
          notes,
          onNotesChange: setNotes,
          fieldErrors,
          onSaveDraft: editingRecipeId ? undefined : handleSaveDraft,
          savingDraft: saving,
          extraContent: wizardStep === 'general' ? generalExtraContent : null,
        }}
        compositionStep={{
          componentCount: compositionRows.length,
          totalNetLabel: compositionTotalNetLabel,
          batchWeightWarning: compositionBatchWeightWarning,
          readOnly: compositionReadOnly,
          onAddComponent: handleAddCompositionRow,
          children: (
            <RecipeCompositionTable
              rows={compositionRows}
              supplyItems={supplyItems}
              supplyItemsLoading={supplyItemsQuery.isLoading}
              readOnly={compositionReadOnly}
              theme={theme}
              fieldErrors={compositionFieldErrors}
              onRowsChange={setCompositionRows}
              onRemoveRow={handleRemoveCompositionRow}
              onDuplicateRow={handleDuplicateCompositionRow}
              onMoveRow={handleMoveCompositionRow}
            />
          ),
        }}
        productionPhasesStep={{
          phaseCount: phases.length,
          totalMinutes,
          timeWarning: phasesTimeWarning,
          readOnly: phasesReadOnly,
          onAddPhase: handleAddPhaseRow,
          children: (
            <RecipePhaseAccordion
              rows={phases}
              compositionRows={compositionRows}
              theme={theme}
              readOnly={phasesReadOnly}
              fieldErrors={phaseFieldErrors}
              onRowsChange={setPhases}
              onRemoveRow={handleRemovePhaseRow}
              onMoveRow={handleMovePhaseRow}
            />
          ),
        }}
      />
    </div>
  );
}

export default RecipesManagementScreen;
