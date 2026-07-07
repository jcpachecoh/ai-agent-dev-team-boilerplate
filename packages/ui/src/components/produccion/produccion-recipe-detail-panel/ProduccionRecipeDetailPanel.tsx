import { Copy, X } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './ProduccionRecipeDetailPanel.module.scss';
import { ProduccionPhaseListItem } from '../produccion-phase-list-item/ProduccionPhaseListItem';
import type {
  ProduccionRecipeDetailData,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionRecipeDetailPanelProps {
  recipe?: ProduccionRecipeDetailData;
  onEdit?: () => void;
  onClone?: () => void;
  onClose?: () => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
const defaultRecipe: ProduccionRecipeDetailData = {
  name: 'Costillas BBQ',
  category: 'Proteínas',
  productName: 'Costillas BBQ 300g',
  batchSizeLabel: '30 kg',
  phaseCount: 4,
  totalTimeLabel: '2h 25min',
  versionLabel: 'v1.8',
  status: 'published',
  metrics: [
    { label: 'Lote', value: '30 kg' },
    { label: 'Tiempo', value: '2h 25min' },
    { label: 'Fases', value: '4' },
  ],
  phases: [
    {
      order: 1,
      name: 'Deshuesado',
      stationLabel: 'EST-02 Corte y Deshuese',
      durationLabel: '25 min',
      operatorsLabel: '2–3 op.',
    },
    {
      order: 2,
      name: 'Marinado BBQ',
      stationLabel: 'EST-01 Mise en place',
      durationLabel: '20 min',
      operatorsLabel: '1–1 op.',
    },
    {
      order: 3,
      name: 'Asado lento',
      stationLabel: 'EST-03 Parrilla Central',
      durationLabel: '1h 30min',
      operatorsLabel: '1–1 op.',
      requiresQA: true,
    },
    {
      order: 4,
      name: 'Glaseado BBQ',
      stationLabel: 'EST-03 Parrilla Central',
      durationLabel: '10 min',
      operatorsLabel: '1–1 op.',
    },
  ],
};
export function ProduccionRecipeDetailPanel({
  recipe = defaultRecipe,
  onEdit,
  onClone,
  onClose,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionRecipeDetailPanelProps): JSX.Element {
  const metrics = recipe.metrics ?? [
    { label: 'Lote', value: recipe.batchSizeLabel },
    { label: 'Tiempo', value: recipe.totalTimeLabel },
    { label: 'Fases', value: String(recipe.phaseCount) },
  ];
  return (
    <aside
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            {recipe.category} · {recipe.versionLabel}
          </p>
          <h3>{recipe.name}</h3>
          <p className={styles.subtle}>{recipe.productName}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Cerrar detalle"
          >
            <X aria-hidden />
          </button>
        ) : null}
      </header>
      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={onEdit}>
          EDITAR
        </button>
        <button type="button" onClick={onClone}>
          <Copy aria-hidden /> CLONAR
        </button>
      </div>
      <section>
        <p className={styles.sectionTitle}>Fases de producción</p>
        <div className={styles.phases}>
          {recipe.phases?.map((phase) => (
            <ProduccionPhaseListItem
              key={`${phase.order}-${phase.name}`}
              {...phase}
              theme={theme}
              size="sm"
            />
          ))}
        </div>
      </section>
    </aside>
  );
}
export default ProduccionRecipeDetailPanel;
