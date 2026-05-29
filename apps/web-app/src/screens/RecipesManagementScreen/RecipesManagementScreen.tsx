import {
  LogoutButton,
  RecetaActionButton,
  RecetaFilterSelect,
  RecetaFormButton,
  RecetaHistoryAccordion,
  RecetaInfoPanel,
  RecetaMetricCard,
  RecetaPhaseAddButton,
  RecetaPhaseModal,
  RecetaProgressIndicator,
  RecetaResultButton,
  RecetaSearch,
  RecetaStepCard,
  RecetaTableHeader,
  type RecetaTableColumn,
  RecetaTableRow,
  RecetaTimelinePanel,
  RecetaUtilityButton,
} from '@restopsiq/ui';
import { Cog, History, List } from 'lucide-react';
import { type CSSProperties, useMemo, useState } from 'react';

import styles from './RecipesManagementScreen.module.scss';

type RecipesView = 'list' | 'process' | 'history' | 'editor';
type RecipeCategory = 'Entrada' | 'Plato Fuerte' | 'Postre' | 'Bebida';
type ResponsibleRole = 'Operario' | 'Supervisor' | 'Manager';

const responsibleOptions = [
  { value: 'Operario', label: 'Operario' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Manager', label: 'Manager' },
];

type RecetaStatus = 'active' | 'inactive';
type RecetaResult = 'ok' | 'warning' | 'failed';

interface RecipeItem {
  id: string;
  code: string;
  name: string;
  category: RecipeCategory;
  durationMin: number;
  phases: number;
  status: RecetaStatus;
}

interface RecipePhase {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  assignee: ResponsibleRole;
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

const recipeListColumnsTemplate = recipeListTableColumns
  .map((column) => column.width ?? '1fr')
  .join(' ');

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

const processColumnsTemplate = processTableColumns.map((column) => column.width ?? '1fr').join(' ');

const recipesSeed: RecipeItem[] = [
  {
    id: 'r1',
    code: 'RC-001',
    name: 'Lomo de Cerdo al Carbon',
    category: 'Plato Fuerte',
    durationMin: 45,
    phases: 6,
    status: 'active',
  },
  {
    id: 'r2',
    code: 'RC-002',
    name: 'Costillas BBQ',
    category: 'Plato Fuerte',
    durationMin: 60,
    phases: 8,
    status: 'active',
  },
  {
    id: 'r3',
    code: 'RC-003',
    name: 'Ensalada Cesar',
    category: 'Entrada',
    durationMin: 15,
    phases: 3,
    status: 'active',
  },
  {
    id: 'r4',
    code: 'RC-004',
    name: 'Arepas Rellenas',
    category: 'Entrada',
    durationMin: 20,
    phases: 4,
    status: 'active',
  },
  {
    id: 'r5',
    code: 'RC-005',
    name: 'Flan de Caramelo',
    category: 'Postre',
    durationMin: 90,
    phases: 5,
    status: 'active',
  },
  {
    id: 'r6',
    code: 'RC-006',
    name: 'Limonada Natural',
    category: 'Bebida',
    durationMin: 10,
    phases: 2,
    status: 'active',
  },
  {
    id: 'r7',
    code: 'RC-007',
    name: 'Pechuga a la Plancha',
    category: 'Plato Fuerte',
    durationMin: 30,
    phases: 5,
    status: 'inactive',
  },
];

const processRows = [
  {
    code: 'RC-001',
    name: 'Lomo de Cerdo al Carbon',
    category: 'Plato Fuerte',
    phases: 6,
    duration: '45 min',
    status: 'Validado',
    result: 'ok' as RecetaResult,
    health: 98,
    lastValidation: '25 de may, 08:30 p. m.',
  },
  {
    code: 'RC-002',
    name: 'Costillas BBQ',
    category: 'Plato Fuerte',
    phases: 8,
    duration: '60 min',
    status: 'En proceso',
    result: 'warning' as RecetaResult,
    health: 85,
    lastValidation: '25 de may, 12:15 p. m.',
  },
  {
    code: 'RC-003',
    name: 'Ensalada Cesar',
    category: 'Entrada',
    phases: 3,
    duration: '15 min',
    status: 'Validado',
    result: 'ok' as RecetaResult,
    health: 100,
    lastValidation: '25 de may, 10:00 a. m.',
  },
  {
    code: 'RC-004',
    name: 'Arepas Rellenas',
    category: 'Entrada',
    phases: 4,
    duration: '20 min',
    status: 'Validado',
    result: 'ok' as RecetaResult,
    health: 95,
    lastValidation: '25 de may, 09:45 a. m.',
  },
  {
    code: 'RC-005',
    name: 'Flan de Caramelo',
    category: 'Postre',
    phases: 5,
    duration: '90 min',
    status: 'Falla',
    result: 'failed' as RecetaResult,
    health: 62,
    lastValidation: '24 de may, 04:20 p. m.',
  },
  {
    code: 'RC-006',
    name: 'Limonada Natural',
    category: 'Bebida',
    phases: 2,
    duration: '10 min',
    status: 'Validado',
    result: 'ok' as RecetaResult,
    health: 100,
    lastValidation: '25 de may, 11:30 a. m.',
  },
];

const historyRows = [
  {
    value: 'EX-001',
    code: 'EX-001',
    recipeName: 'Lomo de Cerdo al Carbon',
    operatorName: 'Carlos Mendez',
    date: '25 de may, 08:36 a. m.',
    progress: '6/6',
    result: 'ok' as RecetaResult,
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
    result: 'warning' as RecetaResult,
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
    result: 'failed' as RecetaResult,
    validationsOk: 5,
    validationsFailed: 3,
    duration: '45 / 90 min',
    observations: 'Validacion de temperatura fallida en fase de horneado',
    phases: [{ title: 'Horneado', note: 'Temp. insuficiente', duration: '45 min' }],
  },
];

const initialPhases: RecipePhase[] = [
  {
    id: 'p1',
    title: 'Preparacion de ingredientes',
    description: 'Lavar, cortar y preparar todos los ingredientes segun especificaciones.',
    durationMin: 15,
    assignee: 'Operario',
  },
  {
    id: 'p2',
    title: 'Marinado',
    description: 'Aplicar marinada y dejar reposar en refrigeracion.',
    durationMin: 30,
    assignee: 'Operario',
  },
  {
    id: 'p3',
    title: 'Coccion',
    description: 'Controlar temperatura y punto de coccion segun estandar.',
    durationMin: 45,
    assignee: 'Supervisor',
  },
];

interface RecipesManagementScreenProps {
  operatorName?: string;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export function RecipesManagementScreen({
  operatorName = 'Operario 5678',
  onLogout,
  isLoggingOut = false,
}: RecipesManagementScreenProps): React.JSX.Element {
  const [currentView, setCurrentView] = useState<RecipesView>('list');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RecetaStatus>('all');

  const [name, setName] = useState('Lomo de Cerdo al Carbon');
  const [category, setCategory] = useState<RecipeCategory>('Plato Fuerte');
  const [description, setDescription] = useState('Descripcion general de la receta...');
  const [totalMinutes] = useState('90');
  const [yieldPortions, setYieldPortions] = useState('4 porciones');
  const [phases, setPhases] = useState<RecipePhase[]>(initialPhases);

  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [phaseName, setPhaseName] = useState('');
  const [phaseDescription, setPhaseDescription] = useState('');
  const [phaseDuration, setPhaseDuration] = useState('10');
  const [phaseResponsible, setPhaseResponsible] = useState<ResponsibleRole>('Operario');

  const filteredRecipes = useMemo(() => {
    return recipesSeed.filter((recipe) => {
      const matchSearch = recipe.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || recipe.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [search, categoryFilter, statusFilter]);

  const totals = useMemo(() => {
    const total = filteredRecipes.length;
    const active = filteredRecipes.filter((r) => r.status === 'active').length;
    const avg = total
      ? Math.round(filteredRecipes.reduce((acc, item) => acc + item.durationMin, 0) / total)
      : 0;
    return { total, active, avg };
  }, [filteredRecipes]);

  const processStats = {
    total: processRows.length,
    validated: 4,
    inProgress: 1,
    failed: 1,
    health: 90,
  };
  const historyStats = { total: historyRows.length, success: 1, warning: 1, failed: 1 };
  const categoryOptions = [
    { value: 'all', label: 'Todas las categorias' },
    { value: 'Entrada', label: 'Entrada' },
    { value: 'Plato Fuerte', label: 'Plato Fuerte' },
    { value: 'Postre', label: 'Postre' },
    { value: 'Bebida', label: 'Bebida' },
  ];
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

  const handleCreatePhase = (): void => {
    if (!phaseName.trim()) {
      return;
    }
    const durationValue = Number.parseInt(phaseDuration, 10);
    const nextPhase: RecipePhase = {
      id: `p${Date.now()}`,
      title: phaseName.trim(),
      description: phaseDescription.trim() || 'Sin descripcion',
      durationMin: Number.isNaN(durationValue) ? 0 : durationValue,
      assignee: phaseResponsible,
    };
    setPhases((prev) => [...prev, nextPhase]);
    setPhaseModalOpen(false);
    setPhaseName('');
    setPhaseDescription('');
    setPhaseDuration('10');
    setPhaseResponsible('Operario');
  };

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
              theme="dark"
              variant="type-1"
              title="Total recetas"
              value={processStats.total}
              size="xl"
            />
            <RecetaMetricCard
              theme="dark"
              variant="type-2"
              title="Validadas"
              value={processStats.validated}
              size="xl"
            />
            <RecetaMetricCard
              theme="dark"
              variant="type-2"
              title="En progreso"
              value={processStats.inProgress}
              size="xl"
            />
            <RecetaMetricCard
              theme="dark"
              variant="type-3"
              title="Con fallas"
              value={processStats.failed}
              size="xl"
            />
            <RecetaMetricCard
              theme="dark"
              variant="type-1"
              title="Salud prom."
              value={`${processStats.health}%`}
              size="xl"
            />
          </section>
          <section className={styles.toolbarRow}>
            <RecetaSearch
              theme="dark"
              size="md"
              value={search}
              onChange={setSearch}
              className={styles.searchGrow}
            />
            <RecetaFilterSelect
              theme="dark"
              size="md"
              className={styles.filterSelect}
              value={statusFilter}
              options={recipeStatusOptions}
              onChange={(value) => setStatusFilter(value as 'all' | RecetaStatus)}
            />
          </section>
          <section className={[styles.tableWrap, styles.tableWrapProcess].join(' ')}>
            <RecetaTableHeader
              theme="dark"
              size="md"
              className={[styles.tableHead, styles.processTableHead].join(' ')}
              columns={processTableColumns}
            />
            <div className={styles.tableBody}>
              {processRows.map((row) => (
                <div
                  key={row.code}
                  className={styles.processRow}
                  style={{ '--receta-columns': processColumnsTemplate } as CSSProperties}
                >
                  <span className={[styles.processCell, styles.processCellCode].join(' ')}>
                    {row.code}
                  </span>
                  <span className={[styles.processCell, styles.processCellName].join(' ')}>
                    {row.name}
                  </span>
                  <span className={styles.processCell}>{row.category}</span>
                  <span className={[styles.processCell, styles.processCellCenter].join(' ')}>
                    {row.phases}
                  </span>
                  <span className={styles.processCell}>{row.duration}</span>
                  <span className={styles.processCellStatus}>
                    <RecetaResultButton
                      variant={row.result}
                      theme="dark"
                      size="sm"
                      label={row.status}
                    />
                  </span>
                  <span className={[styles.processCell, styles.processCellMuted].join(' ')}>
                    {row.lastValidation}
                  </span>
                  <span className={styles.processProgressCell}>
                    <RecetaProgressIndicator
                      theme="dark"
                      size="sm"
                      value={row.health}
                      max={100}
                      variant={
                        row.result === 'failed'
                          ? 'danger'
                          : row.result === 'warning'
                            ? 'warning'
                            : 'success'
                      }
                    />
                  </span>
                  <span className={styles.processActionsCell}>
                    <RecetaUtilityButton theme="dark" size="sm" variant="view" />
                    <RecetaUtilityButton theme="dark" size="sm" variant="pdf" />
                  </span>
                </div>
              ))}
            </div>
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
              theme="dark"
              variant="type-1"
              title="Total ejecuciones"
              value={historyStats.total}
              size="xl"
            />
            <RecetaMetricCard
              theme="dark"
              variant="type-2"
              title="Exitosas"
              value={historyStats.success}
              size="xl"
            />
            <RecetaMetricCard
              theme="dark"
              variant="type-2"
              title="Con advertencias"
              value={historyStats.warning}
              size="xl"
            />
            <RecetaMetricCard
              theme="dark"
              variant="type-3"
              title="Fallidas"
              value={historyStats.failed}
              size="xl"
            />
          </section>
          <section className={styles.toolbarRow}>
            <RecetaSearch
              theme="dark"
              size="md"
              value={search}
              onChange={setSearch}
              className={styles.searchGrow}
              placeholder="Buscar por receta u operador..."
            />
            <RecetaFilterSelect
              theme="dark"
              size="md"
              className={styles.filterSelect}
              value={statusFilter}
              options={historyStatusOptions}
              onChange={(value) => setStatusFilter(value as 'all' | RecetaStatus)}
            />
          </section>
          <section className={styles.historyWrap}>
            <RecetaHistoryAccordion theme="dark" size="xl" items={historyRows} />
          </section>
        </>
      );
    }

    if (currentView === 'editor') {
      return (
        <>
          <header className={styles.pageHeaderEditor}>
            <div className={styles.editorLeft}>
              <RecetaFormButton
                variant="cancel"
                theme="dark"
                label="Volver"
                onClick={() => setCurrentView('list')}
              />
              <div>
                <h1>Editar Receta</h1>
                <p>RC-001</p>
              </div>
            </div>
            <div className={styles.editorActions}>
              <RecetaFormButton variant="discard" theme="dark" label="Descartar" />
              <RecetaFormButton variant="save" theme="dark" label="Guardar Receta" />
            </div>
          </header>
          <section className={styles.editorLayout}>
            <div className={styles.editorMain}>
              <RecetaInfoPanel
                theme="dark"
                nameValue={name}
                categoryValue={category}
                yieldValue={yieldPortions}
                descriptionValue={description}
                onNameChange={setName}
                onCategoryChange={(value) => setCategory(value as RecipeCategory)}
                onYieldChange={setYieldPortions}
                onDescriptionChange={setDescription}
              />

              <section className={styles.panelCard}>
                <div className={styles.panelHeaderRow}>
                  <h3>Fases del Proceso ({phases.length})</h3>
                  <RecetaPhaseAddButton
                    theme="dark"
                    label="Agregar Fase"
                    size="xl"
                    onClick={() => setPhaseModalOpen(true)}
                  />
                </div>
                <div className={styles.stepsList}>
                  {phases.map((phase, index) => (
                    <RecetaStepCard
                      key={phase.id}
                      theme="dark"
                      selected
                      stepNumber={index + 1}
                      title={phase.title}
                      description={phase.description}
                      duration={`${phase.durationMin} min`}
                      assignee={phase.assignee}
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
                theme="dark"
                variant="type-2"
                title="Tiempo total"
                value={`${totalMinutes} min`}
                size="xl"
              />
              <RecetaMetricCard
                theme="dark"
                variant="type-1"
                title="Fases definidas"
                value={phases.length}
                size="xl"
              />
              <RecetaTimelinePanel
                theme="dark"
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
            theme="dark"
            variant="type-1"
            title="Total recetas"
            value={totals.total}
            size="xl"
          />
          <RecetaMetricCard
            theme="dark"
            variant="type-2"
            title="Activas"
            value={totals.active}
            size="xl"
          />
          <RecetaMetricCard
            theme="dark"
            variant="type-3"
            title="Tiempo prom."
            value={`${totals.avg} min`}
            size="xl"
          />
        </section>
        <section className={[styles.toolbarRow, styles.toolbarRowList].join(' ')}>
          <RecetaSearch
            theme="dark"
            size="md"
            value={search}
            onChange={setSearch}
            className={[styles.searchGrow, styles.searchGrowList].join(' ')}
          />
          <RecetaFilterSelect
            theme="dark"
            size="md"
            className={[styles.filterSelect, styles.filterSelectList].join(' ')}
            value={categoryFilter}
            options={categoryOptions}
            onChange={setCategoryFilter}
          />
          <RecetaFilterSelect
            theme="dark"
            size="md"
            className={[styles.filterSelect, styles.filterSelectList].join(' ')}
            value={statusFilter}
            options={recipeStatusOptions}
            onChange={(value) => setStatusFilter(value as 'all' | RecetaStatus)}
          />
          <RecetaActionButton
            theme="dark"
            size="md"
            label="Nueva Receta"
            className={[styles.toolbarAction, styles.toolbarActionList].join(' ')}
            onClick={() => setCurrentView('editor')}
          />
        </section>
        <section className={[styles.tableWrap, styles.tableWrapList].join(' ')}>
          <RecetaTableHeader
            theme="dark"
            size="md"
            className={[styles.tableHead, styles.listTableHead].join(' ')}
            columns={recipeListTableColumns}
          />
          <div className={styles.tableBody}>
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className={styles.rowClickable}
                onClick={() => setCurrentView('editor')}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setCurrentView('editor');
                  }
                }}
              >
                <RecetaTableRow
                  theme="dark"
                  size="xl"
                  density="compact"
                  className={styles.tableRow}
                  columnsTemplate={recipeListColumnsTemplate}
                  code={recipe.code}
                  recipeName={recipe.name}
                  category={recipe.category}
                  duration={`${recipe.durationMin} min`}
                  portions={recipe.phases}
                  status={recipe.status}
                  onEdit={() => setCurrentView('editor')}
                />
              </div>
            ))}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className={styles.screen}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <p className={styles.brand}>RestOpsIQ WEB</p>
          <h2 className={styles.title}>Gestion de Recetas</h2>
        </div>
        <nav className={styles.nav} aria-label="Navegacion de recetas">
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <button
                type="button"
                className={[styles.navButton, currentView === 'list' && styles.navButtonActive]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setCurrentView('list')}
              >
                <List size={16} /> Listado de Recetas
              </button>
            </li>
            <li className={styles.navItem}>
              <button
                type="button"
                className={[styles.navButton, currentView === 'process' && styles.navButtonActive]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setCurrentView('process')}
              >
                <Cog size={16} /> Control de Procesos
              </button>
            </li>
            <li className={styles.navItem}>
              <button
                type="button"
                className={[styles.navButton, currentView === 'history' && styles.navButtonActive]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setCurrentView('history')}
              >
                <History size={16} /> Historial de Ejecucion
              </button>
            </li>
          </ul>
        </nav>

        <div className={styles.sidebarBottom}>
          <span className={styles.operatorName}>{operatorName}</span>
          {onLogout ? (
            <LogoutButton
              theme="dark"
              size="sm"
              variant="default"
              onClick={onLogout}
              loading={isLoggingOut}
            />
          ) : null}
        </div>
      </aside>

      <main className={styles.content}>{renderMainContent()}</main>

      <RecetaPhaseModal
        open={phaseModalOpen}
        onClose={() => setPhaseModalOpen(false)}
        theme="dark"
        size="md"
        phaseName={phaseName}
        onPhaseNameChange={setPhaseName}
        phaseDescription={phaseDescription}
        onPhaseDescriptionChange={setPhaseDescription}
        phaseDuration={phaseDuration}
        onPhaseDurationChange={setPhaseDuration}
        phaseResponsible={phaseResponsible}
        responsibleOptions={responsibleOptions}
        onPhaseResponsibleChange={(value) => setPhaseResponsible(value as ResponsibleRole)}
        onCancel={() => setPhaseModalOpen(false)}
        onSave={handleCreatePhase}
      />
    </div>
  );
}

export default RecipesManagementScreen;
