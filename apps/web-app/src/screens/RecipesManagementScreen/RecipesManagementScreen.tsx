import {
  RecetaActionButton,
  RecetaFilterSelect,
  RecetaFormButton,
  RecetaMetricCard,
  RecetaPhaseAddButton,
  RecetaPhaseModal,
  RecetaResultButton,
  RecetaSearch,
  RecetaStepCard,
  RecetaTableHeader,
  type RecetaTableColumn,
  RecetaTimelinePanel,
  RecetaUtilityButton,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { HistoryResponsiveList } from '@/components/recetas/HistoryResponsiveList';
import { ProcessListCard } from '@/components/recetas/ProcessListCard';
import { ProcessListRow } from '@/components/recetas/ProcessListRow';
import { RecipeListCard } from '@/components/recetas/RecipeListCard';
import { RecipeListResponsiveRow } from '@/components/recetas/RecipeListResponsiveRow';
import { ResponsiveTable } from '@/components/responsive-table';
import type { PlantRecipePhase } from '@/api/plant';
import { PROCESS_RESPONSIVE_COLUMNS } from '@/features/recetas/process-columns';
import {
  RECIPE_LIST_RESPONSIVE_COLUMNS,
  recetaTableColumnsForVisible,
} from '@/features/recetas/recipe-list-columns';
import type { ProcessRow, RecipeListItem } from '@/features/recetas/types';
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
import type { StockUnit } from '@/features/inventario/types';
import { STOCK_UNIT_OPTIONS } from '@/types/inventory';

import styles from './RecipesManagementScreen.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

type RecipesView = 'list' | 'process' | 'history' | 'editor';
type ResponsibleRole = 'Operario' | 'Supervisor' | 'Manager';

const responsibleOptions = [
  { value: 'Operario', label: 'Operario' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Manager', label: 'Manager' },
];

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

interface PhaseIngredientDraft {
  id: string;
  supplyItemId: string;
  quantityPerBatch: string;
  unit: StockUnit;
}

interface PhaseValidationDraft {
  id: string;
  label: string;
}

interface RecipePhase {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  workStationId: string;
  assignee: ResponsibleRole;
  ingredients: PhaseIngredientDraft[];
  validations: PhaseValidationDraft[];
}

const VALIDATION_PRESETS = [
  'Temperatura correcta',
  'Punto de coccion',
  'Peso correcto',
  'Presentacion',
] as const;

function buildPhaseDescription(base: string, validations: PhaseValidationDraft[]): string {
  const trimmed = base.trim() || 'Sin descripcion';
  if (validations.length === 0) {
    return trimmed;
  }
  const lines = validations.map((v) => `- ${v.label.trim() || 'Criterio sin nombre'}`);
  return `${trimmed}\n\nCriterios de validacion:\n${lines.join('\n')}`;
}

function parsePhaseDescription(description: string | null | undefined): {
  base: string;
  validations: PhaseValidationDraft[];
} {
  if (!description?.trim()) {
    return { base: '', validations: [] };
  }

  const marker = '\n\nCriterios de validacion:\n';
  const markerIndex = description.indexOf(marker);
  if (markerIndex === -1) {
    const trimmed = description.trim();
    return {
      base: trimmed === 'Sin descripcion' ? '' : trimmed,
      validations: [],
    };
  }

  const base = description.slice(0, markerIndex).trim();
  const validationBlock = description.slice(markerIndex + marker.length);
  const validations = validationBlock
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: `val-loaded-${index}`,
      label,
    }));

  return {
    base: base === 'Sin descripcion' ? '' : base,
    validations,
  };
}

function mapPlantPhaseToEditor(phase: PlantRecipePhase): RecipePhase {
  const { base, validations } = parsePhaseDescription(phase.description);
  return {
    id: phase.id,
    title: phase.name,
    description: buildPhaseDescription(base, validations),
    durationMin: phase.standardMinutes,
    workStationId: phase.workStationId,
    assignee: 'Operario',
    ingredients: phase.inputs.map((input: PlantRecipePhase['inputs'][number]) => ({
      id: input.id,
      supplyItemId: input.supplyItemId,
      quantityPerBatch: String(input.quantityPerBatch),
      unit: input.unit as StockUnit,
    })),
    validations:
      validations.length > 0
        ? validations
        : phase.requiresQA
          ? [{ id: 'val-qa', label: VALIDATION_PRESETS[0] }]
          : [],
  };
}

function formatQuantity(value: string): string {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return '1.000';
  }
  return parsed.toFixed(3);
}

const recipeListTableColumns: RecetaTableColumn[] = [
  { key: 'id', label: 'ID', width: '120px' },
  { key: 'nombre', label: 'Nombre', width: 'minmax(0, 2fr)' },
  { key: 'categoria', label: 'Categoria', width: 'minmax(140px, 1fr)' },
  { key: 'tiempo', label: 'Tiempo est.', width: '120px' },
  { key: 'fases', label: 'Fases', width: '90px', align: 'center' },
  { key: 'estado', label: 'Estado', width: '150px', align: 'center' },
  { key: 'acciones', label: 'Acciones', width: '130px', align: 'right' },
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

function parseEstimatedMinutes(value: string, fallback: number): number {
  const parsed = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return Math.max(1, fallback);
  }
  return parsed;
}

function parseBatchSize(yieldText: string): string {
  const match = yieldText.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return '1.000';
  }
  const value = Number.parseFloat(match[1]);
  if (Number.isNaN(value) || value <= 0) {
    return '1.000';
  }
  return value.toFixed(3);
}

function formatOptionalPackageWeight(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed.replace(',', '.'));
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed.toFixed(3);
}

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
  const [statusFilter, setStatusFilter] = useState<'all' | RecetaStatus>('all');

  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [batchSize, setBatchSize] = useState('1');
  const [batchUnit, setBatchUnit] = useState<StockUnit>('KILOGRAMS');
  const [packageWeight, setPackageWeight] = useState('');
  const [recipeActive, setRecipeActive] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [phases, setPhases] = useState<RecipePhase[]>([]);
  const [finishedProductId, setFinishedProductId] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [persistedPhaseIds, setPersistedPhaseIds] = useState<string[]>([]);
  const [phaseName, setPhaseName] = useState('');
  const [phaseDescription, setPhaseDescription] = useState('');
  const [phaseDuration, setPhaseDuration] = useState('10');
  const [phaseResponsible, setPhaseResponsible] = useState<ResponsibleRole>('Operario');
  const [phaseWorkStationId, setPhaseWorkStationId] = useState('');
  const [phaseIngredients, setPhaseIngredients] = useState<PhaseIngredientDraft[]>([]);
  const [phaseValidations, setPhaseValidations] = useState<PhaseValidationDraft[]>([]);

  const historyRows = historyRowsSeed;
  const historyStats = {
    total: historyRows.length,
    success: historyRows.filter((r) => r.result === 'ok').length,
    warning: historyRows.filter((r) => r.result === 'warning').length,
    failed: historyRows.filter((r) => r.result === 'failed').length,
  };
  const isListOrEditor = currentView === 'list' || currentView === 'editor';
  const isEditor = currentView === 'editor';

  const recipesQuery = usePlantRecipes(isListOrEditor);
  const processQuery = usePlantProcess(currentView === 'process');
  const supplyItemsQuery = useEditorSupplyItems(isEditor);
  const recipeCategoriesQuery = useRecipeCategories('active', isEditor);
  const workstationsQuery = usePlantWorkstations(isEditor);
  const recipeDetailQuery = usePlantRecipeDetail(editingRecipeId);
  const saveRecipeMutation = useSavePlantRecipe();
  const saving = saveRecipeMutation.isPending;

  const recipes = recipesQuery.data ?? [];
  const processRows = processQuery.data?.rows ?? [];
  const processStats = processQuery.data?.stats ?? processStatsInitial;
  const supplyItems = supplyItemsQuery.data ?? [];
  const recipeCategories = recipeCategoriesQuery.data ?? [];
  const workStations = workstationsQuery.data ?? [];

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
      (Boolean(editingRecipeId) && recipeDetailQuery.isLoading));

  // #region agent log
  useEffect(() => {
    if (currentView !== 'editor' || editorLoading) return;
    const labelEl = document.querySelector('[class*="editorField"] span');
    const inputEl = document.querySelector('[class*="editorInput"]');
    fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd2ab57' },
      body: JSON.stringify({
        sessionId: 'd2ab57',
        runId: 'post-fix-receta-editor',
        hypothesisId: 'H1',
        location: 'RecipesManagementScreen.tsx:editor-theme-probe',
        message: 'Recipe editor light mode probe',
        data: {
          uiTheme: theme,
          dataTheme: document.documentElement.dataset.theme ?? null,
          labelColor: labelEl ? getComputedStyle(labelEl).color : null,
          inputBackground: inputEl ? getComputedStyle(inputEl).backgroundColor : null,
          inputColor: inputEl ? getComputedStyle(inputEl).color : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [currentView, theme, editorLoading]);

  useEffect(() => {
    if (currentView !== 'history') return;
    const itemEl = document.querySelector('[class*="RecetaHistoryAccordion"] [data-state]');
    fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd2ab57' },
      body: JSON.stringify({
        sessionId: 'd2ab57',
        runId: 'post-fix-history',
        hypothesisId: 'H1',
        location: 'RecipesManagementScreen.tsx:history-theme-probe',
        message: 'History accordion light mode probe',
        data: {
          uiTheme: theme,
          dataTheme: document.documentElement.dataset.theme ?? null,
          itemBackground: itemEl ? getComputedStyle(itemEl).backgroundColor : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [currentView, theme]);
  // #endregion

  const totalMinutes = useMemo(
    () => phases.reduce((sum, phase) => sum + phase.durationMin, 0),
    [phases],
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
    if (recipeCategories.length > 0) {
      setCategoryId((prev) => prev || recipeCategories[0]?.id || '');
    }
  }, [isEditor, editingRecipeId, supplyItems, recipeCategories]);

  useEffect(() => {
    if (!editingRecipeId || !recipeDetailQuery.data) {
      return;
    }

    const detail = recipeDetailQuery.data;
    setName(detail.name);
    setNotes(detail.notes ?? '');
    setFinishedProductId(detail.finishedProductId);
    setBatchSize(String(detail.batchSize));
    setBatchUnit(detail.batchUnit as StockUnit);
    setPackageWeight(detail.packageWeight ?? '');
    setRecipeActive(detail.isActive);
    setCategoryId(detail.categoryId ?? '');
    setEstimatedMinutes(String(detail.estimatedMinutes));
    setPhases(detail.phases.map(mapPlantPhaseToEditor));
    setPersistedPhaseIds(detail.phases.map((phase) => phase.id));
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
    setCurrentView('list');
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

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchSearch = recipe.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || recipe.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [recipes, search, categoryFilter, statusFilter]);

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
    const active = filteredRecipes.filter((r) => r.status === 'active').length;
    const avg = total
      ? Math.round(filteredRecipes.reduce((acc, item) => acc + item.durationMin, 0) / total)
      : 0;
    return { total, active, avg };
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
    const item = supplyItems.find((entry) => entry.id === productId);
    if (item) {
      setBatchUnit(item.unidadBase);
    }
  };

  const openNewRecipeEditor = (): void => {
    setEditingRecipeId(null);
    setPersistedPhaseIds([]);
    setName('');
    setNotes('');
    setBatchSize('1');
    setBatchUnit('KILOGRAMS');
    setPackageWeight('');
    setRecipeActive(true);
    setCategoryId('');
    setEstimatedMinutes('30');
    setPhases([]);
    setFinishedProductId('');
    setSaveError(null);
    setCurrentView('editor');
  };

  const openEditRecipeEditor = (recipeId: string): void => {
    setSaveError(null);
    setEditingRecipeId(recipeId);
    setCurrentView('editor');
  };

  const handleDiscardEditor = (): void => {
    setSaveError(null);
    setCurrentView('list');
  };

  const handleSaveRecipe = async (): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError('El nombre de la receta es obligatorio');
      return;
    }
    if (!finishedProductId) {
      setSaveError('Selecciona un producto terminado (insumo)');
      return;
    }
    if (phases.length === 0) {
      setSaveError('Agrega al menos una fase al proceso');
      return;
    }

    const defaultWorkStationId = workStations[0]?.id ?? '';
    if (phases.some((phase) => !phase.workStationId && !defaultWorkStationId)) {
      setSaveError('Cada fase necesita una estación de trabajo. Ejecuta el seed de planta.');
      return;
    }

    const resolvedPhases = phases.map((phase) => ({
      ...phase,
      workStationId: phase.workStationId || defaultWorkStationId,
    }));

    const estimatedMinutesValue = parseEstimatedMinutes(estimatedMinutes, totalMinutes);

    setSaveError(null);

    const recipePayload = {
      name: trimmedName,
      categoryId: categoryId || null,
      finishedProductId,
      batchSize: parseBatchSize(batchSize),
      batchUnit,
      packageWeight: formatOptionalPackageWeight(packageWeight),
      estimatedMinutes: estimatedMinutesValue,
      notes: notes.trim() || undefined,
      isActive: recipeActive,
    };

    saveRecipeMutation.mutate(
      editingRecipeId
        ? {
            mode: 'update',
            recipeId: editingRecipeId,
            payload: recipePayload,
            phases: resolvedPhases,
            originalPhaseIds: persistedPhaseIds,
          }
        : {
            mode: 'create',
            payload: {
              ...recipePayload,
              phases: resolvedPhases.map((phase, index) => ({
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
                    quantityPerBatch: formatQuantity(ingredient.quantityPerBatch),
                    unit: ingredient.unit,
                  })),
              })),
            },
          },
      {
        onSuccess: () => {
          setEditingRecipeId(null);
          setCurrentView('list');
        },
        onError: (error) => {
          setSaveError(error instanceof Error ? error.message : 'No se pudo guardar la receta');
        },
      },
    );
  };

  const resetPhaseModalDraft = (): void => {
    setEditingPhaseId(null);
    setPhaseName('');
    setPhaseDescription('');
    setPhaseDuration('10');
    setPhaseResponsible('Operario');
    setPhaseWorkStationId(workStations[0]?.id ?? '');
    setPhaseIngredients([]);
    setPhaseValidations([]);
  };

  const openPhaseModal = (): void => {
    resetPhaseModalDraft();
    setSaveError(null);
    setPhaseModalOpen(true);
  };

  const openPhaseModalForEdit = (phase: RecipePhase): void => {
    const { base, validations } = parsePhaseDescription(phase.description);
    setEditingPhaseId(phase.id);
    setPhaseName(phase.title);
    setPhaseDescription(base);
    setPhaseDuration(String(phase.durationMin));
    setPhaseResponsible(phase.assignee);
    setPhaseWorkStationId(phase.workStationId);
    setPhaseIngredients(phase.ingredients);
    setPhaseValidations(phase.validations.length > 0 ? phase.validations : []);
    setSaveError(null);
    setPhaseModalOpen(true);
  };

  const closePhaseModal = (): void => {
    setPhaseModalOpen(false);
    resetPhaseModalDraft();
  };

  const handleAddPhaseIngredient = (): void => {
    if (supplyItems.length === 0) {
      setSaveError('No hay insumos en el catálogo. Revisa inventario o el seed.');
      return;
    }
    const defaultItem = supplyItems[0];
    setPhaseIngredients((prev) => [
      ...prev,
      {
        id: `ing-${Date.now()}-${prev.length}`,
        supplyItemId: defaultItem?.id ?? '',
        quantityPerBatch: '1.000',
        unit: defaultItem?.unidadBase ?? 'KILOGRAMS',
      },
    ]);
  };

  const handleAddPhaseValidation = (): void => {
    const preset = VALIDATION_PRESETS[phaseValidations.length % VALIDATION_PRESETS.length];
    setPhaseValidations((prev) => [
      ...prev,
      {
        id: `val-${Date.now()}-${prev.length}`,
        label: preset,
      },
    ]);
  };

  const handleSavePhase = (): void => {
    if (!phaseName.trim()) {
      setSaveError('El nombre de la fase es obligatorio');
      return;
    }
    const durationValue = Number.parseInt(phaseDuration, 10);
    if (Number.isNaN(durationValue) || durationValue < 1) {
      setSaveError('La duracion de la fase debe ser al menos 1 minuto');
      return;
    }
    if (!phaseWorkStationId) {
      setSaveError('Selecciona una estación de trabajo para la fase');
      return;
    }
    const nextPhase: RecipePhase = {
      id: editingPhaseId ?? `p${Date.now()}`,
      title: phaseName.trim(),
      description: buildPhaseDescription(phaseDescription, phaseValidations),
      durationMin: durationValue,
      workStationId: phaseWorkStationId,
      assignee: phaseResponsible,
      ingredients: phaseIngredients
        .filter((row) => row.supplyItemId)
        .map((row) => ({
          ...row,
          quantityPerBatch: formatQuantity(row.quantityPerBatch),
        })),
      validations: phaseValidations.filter((row) => row.label.trim()),
    };

    setPhases((prev) => {
      if (editingPhaseId) {
        return prev.map((phase) => (phase.id === editingPhaseId ? nextPhase : phase));
      }
      return [...prev, nextPhase];
    });
    setSaveError(null);
    closePhaseModal();
  };

  const phaseModalIngredientsContent = (
    <>
      <label className={styles.editorField}>
        <span>Estación de trabajo *</span>
        <select
          className={styles.editorSelect}
          value={phaseWorkStationId}
          onChange={(event) => setPhaseWorkStationId(event.target.value)}
        >
          <option value="">Seleccionar estación</option>
          {workStations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))}
        </select>
      </label>
      {phaseIngredients.length === 0 ? (
        <p className={styles.modalListEmpty}>Sin ingredientes. Usa Agregar para incluir insumos.</p>
      ) : (
        <ul className={styles.modalList}>
          {phaseIngredients.map((row) => (
            <li key={row.id} className={styles.modalListItem}>
              <select
                className={styles.editorSelect}
                value={row.supplyItemId}
                onChange={(event) => {
                  const item = supplyItems.find((entry) => entry.id === event.target.value);
                  setPhaseIngredients((prev) =>
                    prev.map((ingredient) =>
                      ingredient.id === row.id
                        ? {
                            ...ingredient,
                            supplyItemId: event.target.value,
                            unit: item?.unidadBase ?? ingredient.unit,
                          }
                        : ingredient,
                    ),
                  );
                }}
              >
                <option value="">Seleccionar insumo</option>
                {supplyItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
              <input
                className={styles.modalListInput}
                type="text"
                inputMode="decimal"
                placeholder="Cantidad"
                value={row.quantityPerBatch}
                onChange={(event) =>
                  setPhaseIngredients((prev) =>
                    prev.map((ingredient) =>
                      ingredient.id === row.id
                        ? { ...ingredient, quantityPerBatch: event.target.value }
                        : ingredient,
                    ),
                  )
                }
              />
              <select
                className={styles.modalListUnitSelect}
                value={row.unit}
                onChange={(event) =>
                  setPhaseIngredients((prev) =>
                    prev.map((ingredient) =>
                      ingredient.id === row.id
                        ? { ...ingredient, unit: event.target.value as StockUnit }
                        : ingredient,
                    ),
                  )
                }
              >
                {STOCK_UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.modalListRemove}
                onClick={() =>
                  setPhaseIngredients((prev) =>
                    prev.filter((ingredient) => ingredient.id !== row.id),
                  )
                }
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const phaseModalValidationsContent =
    phaseValidations.length === 0 ? (
      <p className={styles.modalListEmpty}>
        Sin criterios. Usa Agregar para definir validaciones de la fase.
      </p>
    ) : (
      <ul className={styles.modalList}>
        {phaseValidations.map((row) => (
          <li key={row.id} className={styles.modalListItemValidation}>
            <input
              className={styles.modalListInputGrow}
              type="text"
              placeholder="Ej: Temperatura correcta"
              value={row.label}
              onChange={(event) =>
                setPhaseValidations((prev) =>
                  prev.map((criterion) =>
                    criterion.id === row.id
                      ? { ...criterion, label: event.target.value }
                      : criterion,
                  ),
                )
              }
            />
            <button
              type="button"
              className={styles.modalListRemove}
              onClick={() =>
                setPhaseValidations((prev) => prev.filter((criterion) => criterion.id !== row.id))
              }
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
    );

  const renderMainContent = (): React.JSX.Element => {
    if (currentView === 'process') {
      return (
        <>
          <header className={styles.pageHeader}>
            <h1>Control de Procesos</h1>
            <p>Monitoreo de estado y validacion de recetas</p>
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
              onChange={(value) => setStatusFilter(value as 'all' | RecetaStatus)}
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
            <h1>Historial de Ejecucion</h1>
            <p>Trazabilidad de produccion y validaciones</p>
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
              onChange={(value) => setStatusFilter(value as 'all' | RecetaStatus)}
            />
          </section>
          <section className={styles.historyWrap}>
            <HistoryResponsiveList items={filteredHistoryRows} theme={theme} />
          </section>
        </>
      );
    }

    if (currentView === 'editor') {
      const editorTitle = editingRecipeId ? 'Editar Receta' : 'Nueva Receta';
      const editorCode = editingRecipeId
        ? (recipes.find((recipe) => recipe.id === editingRecipeId)?.code ??
          (recipeDetailQuery.data ? formatRecipeCode(recipeDetailQuery.data) : '—'))
        : 'Nueva';

      return (
        <>
          <header className={styles.pageHeaderEditor}>
            <div className={styles.editorLeft}>
              <RecetaFormButton
                variant="cancel"
                theme={theme}
                label="Volver"
                onClick={handleDiscardEditor}
              />
              <div>
                <h1>{editorTitle}</h1>
                <p>{editorCode}</p>
              </div>
            </div>
            <div className={styles.editorActions}>
              <RecetaFormButton
                variant="discard"
                theme={theme}
                label="Descartar"
                onClick={handleDiscardEditor}
              />
              <RecetaFormButton
                variant="save"
                theme={theme}
                label={saving ? 'Guardando...' : 'Guardar'}
                disabled={saving || editorLoading}
                onClick={() => void handleSaveRecipe()}
              />
            </div>
          </header>
          {saveError ? <p className={styles.loadError}>{saveError}</p> : null}
          {editorLoading ? <p className={styles.loadError}>Cargando datos del editor...</p> : null}
          <section className={styles.editorLayout}>
            <div className={styles.editorMain}>
              <section className={styles.panelCard}>
                <h3 className={styles.panelCardTitle}>Datos de la receta</h3>
                <div className={styles.editorFieldGrid}>
                  <label className={styles.editorField}>
                    <span>Nombre *</span>
                    <input
                      className={styles.editorInput}
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ej. Arroz pilaf"
                    />
                  </label>
                  <label className={styles.editorField}>
                    <span>Categoría</span>
                    <select
                      className={styles.editorSelect}
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                    >
                      <option value="">Sin categoría</option>
                      {recipeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.editorField}>
                    <span>Producto terminado *</span>
                    <select
                      className={styles.editorSelect}
                      value={finishedProductId}
                      onChange={(event) => handleFinishedProductChange(event.target.value)}
                    >
                      <option value="">Seleccionar insumo</option>
                      {supplyItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre} ({item.codigoInterno})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.editorField}>
                    <span>Tamaño de lote *</span>
                    <input
                      className={styles.editorInput}
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej. 10"
                      value={batchSize}
                      onChange={(event) => setBatchSize(event.target.value)}
                    />
                  </label>
                  <label className={styles.editorField}>
                    <span>Unidad del lote *</span>
                    <select
                      className={styles.editorSelect}
                      value={batchUnit}
                      onChange={(event) => setBatchUnit(event.target.value as StockUnit)}
                    >
                      {STOCK_UNIT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.editorField}>
                    <span>Peso aprox. por paquete (kg)</span>
                    <input
                      className={styles.editorInput}
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej. 440"
                      value={packageWeight}
                      onChange={(event) => setPackageWeight(event.target.value)}
                    />
                  </label>
                  <label className={styles.editorField}>
                    <span>Tiempo estimado (min) *</span>
                    <input
                      className={styles.editorInput}
                      type="number"
                      min={1}
                      value={estimatedMinutes}
                      onChange={(event) => setEstimatedMinutes(event.target.value)}
                    />
                  </label>
                  <label className={styles.editorField}>
                    <span>Estado *</span>
                    <select
                      className={styles.editorSelect}
                      value={recipeActive ? 'active' : 'inactive'}
                      onChange={(event) => setRecipeActive(event.target.value === 'active')}
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </label>
                  {editingRecipeId ? (
                    <label className={styles.editorField}>
                      <span>Versión</span>
                      <input
                        className={styles.editorInput}
                        type="text"
                        value={
                          recipes.find((recipe) => recipe.id === editingRecipeId)?.code ??
                          (recipeDetailQuery.data ? formatRecipeCode(recipeDetailQuery.data) : '—')
                        }
                        readOnly
                      />
                    </label>
                  ) : null}
                  <label className={[styles.editorField, styles.editorFieldFull].join(' ')}>
                    <span>Notas</span>
                    <textarea
                      className={[styles.editorInput, styles.editorTextarea].join(' ')}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Notas de la receta (opcional)"
                      rows={3}
                    />
                  </label>
                </div>
              </section>

              <section className={styles.panelCard}>
                <div className={styles.panelHeaderRow}>
                  <h3>Fases del Proceso ({phases.length})</h3>
                  <RecetaPhaseAddButton
                    theme={theme}
                    label="Agregar Fase"
                    size="xl"
                    onClick={openPhaseModal}
                  />
                </div>
                <div className={styles.stepsList}>
                  {phases.map((phase, index) => (
                    <RecetaStepCard
                      key={phase.id}
                      theme={theme}
                      selected
                      stepNumber={index + 1}
                      title={phase.title}
                      description={phase.description}
                      duration={`${phase.durationMin} min`}
                      assignee={phase.assignee}
                      onEdit={() => openPhaseModalForEdit(phase)}
                      onDelete={() =>
                        setPhases((prev) => prev.filter((item) => item.id !== phase.id))
                      }
                    />
                  ))}
                </div>
              </section>
            </div>

            <aside className={styles.editorSidebar}>
              <RecetaMetricCard
                theme={theme}
                variant="type-2"
                title="Suma fases"
                value={`${totalMinutes || 0} min`}
                size="xl"
              />
              <RecetaMetricCard
                theme={theme}
                variant="type-1"
                title="Fases definidas"
                value={phases.length}
                size="xl"
              />
              <RecetaTimelinePanel
                theme={theme}
                title="Linea de Tiempo"
                items={phases.map((phase) => ({
                  label: phase.title,
                  duration: `${phase.durationMin} min`,
                }))}
              />
            </aside>
          </section>
        </>
      );
    }

    return (
      <>
        <header className={styles.pageHeader}>
          <h1>Administracion de Recetas</h1>
          <p>Gestion y control de recetas de produccion</p>
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
            title="Activas"
            value={totals.active}
            size="xl"
          />
          <RecetaMetricCard
            theme={theme}
            variant="type-3"
            title="Tiempo prom."
            value={`${totals.avg} min`}
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
            onChange={(value) => setStatusFilter(value as 'all' | RecetaStatus)}
          />
          <RecetaActionButton
            theme={theme}
            size="md"
            label="Nueva Receta"
            className={[styles.toolbarAction, styles.toolbarActionList].join(' ')}
            onClick={openNewRecipeEditor}
          />
        </section>
        <section className={[styles.tableWrap, styles.tableWrapList].join(' ')}>
          <ResponsiveTable<RecipeListItem>
            columns={RECIPE_LIST_RESPONSIVE_COLUMNS}
            rows={filteredRecipes}
            keyExtractor={(recipe) => recipe.id}
            className={styles.recipeListTable}
            renderTableHeader={({ visibleColumns }) => (
              <RecetaTableHeader
                theme={theme}
                size="md"
                className={[styles.tableHead, styles.listTableHead].join(' ')}
                columns={recetaTableColumnsForVisible(recipeListTableColumns, visibleColumns)}
              />
            )}
            renderTableRow={(recipe, { visibleColumns, columnsTemplate }) => (
              <div
                className={styles.rowClickable}
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
                  onEdit={() => openEditRecipeEditor(recipe.id)}
                />
              </div>
            )}
            renderCard={(recipe) => (
              <RecipeListCard
                recipe={recipe}
                theme={theme}
                onEdit={() => openEditRecipeEditor(recipe.id)}
                onOpen={() => openEditRecipeEditor(recipe.id)}
              />
            )}
          />
        </section>
      </>
    );
  };

  return (
    <div className={styles.screen}>
      {loadError ? <p className={styles.loadError}>{loadError}</p> : null}
      <main className={styles.content}>{renderMainContent()}</main>

      <RecetaPhaseModal
        open={phaseModalOpen}
        onClose={closePhaseModal}
        theme={theme}
        size="md"
        title={editingPhaseId ? 'Editar Fase de Proceso' : 'Nueva Fase de Proceso'}
        saveLabel={editingPhaseId ? 'Actualizar Fase' : 'Guardar Fase'}
        phaseName={phaseName}
        onPhaseNameChange={setPhaseName}
        phaseDescription={phaseDescription}
        onPhaseDescriptionChange={setPhaseDescription}
        phaseDuration={phaseDuration}
        onPhaseDurationChange={setPhaseDuration}
        phaseResponsible={phaseResponsible}
        responsibleOptions={responsibleOptions}
        onPhaseResponsibleChange={(value) => setPhaseResponsible(value as ResponsibleRole)}
        onAddIngredient={handleAddPhaseIngredient}
        onAddValidation={handleAddPhaseValidation}
        ingredientsContent={phaseModalIngredientsContent}
        validationsContent={phaseModalValidationsContent}
        onCancel={closePhaseModal}
        onSave={handleSavePhase}
      />
    </div>
  );
}

export default RecipesManagementScreen;
