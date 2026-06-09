import { X } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './ProduccionStationDetailPanel.module.scss';
import { ProduccionStatusBadge } from '../produccion-status-badge/ProduccionStatusBadge';
import { ProduccionTypeBadge } from '../produccion-type-badge/ProduccionTypeBadge';
import type {
  ProduccionSize,
  ProduccionStationDetailData,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionStationDetailPanelProps {
  station?: ProduccionStationDetailData;
  onClose?: () => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
const defaultStation: ProduccionStationDetailData = {
  code: 'EST-04',
  name: 'Línea Fría',
  location: 'Zona C - Refrigeración',
  type: 'Enfriamiento',
  typeTone: 'cooling',
  capacityLabel: '2 operarios',
  status: 'active',
  recipeCountLabel: '1 receta',
  assignedRecipes: [{ name: 'Ensalada César', phaseLabel: 'Enfriamiento controlado' }],
};
export function ProduccionStationDetailPanel({
  station = defaultStation,
  onClose,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionStationDetailPanelProps): JSX.Element {
  return (
    <aside
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{station.code}</p>
          <h3>{station.name}</h3>
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
      <dl className={styles.meta}>
        <div>
          <dt>Ubicación</dt>
          <dd>{station.location}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>
            <ProduccionTypeBadge
              label={station.type}
              tone={station.typeTone}
              theme={theme}
              size="sm"
            />
          </dd>
        </div>
        <div>
          <dt>Cap. máx.</dt>
          <dd>{station.capacityLabel}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <ProduccionStatusBadge status={station.status} theme={theme} size="sm" />
          </dd>
        </div>
      </dl>
      <section>
        <p className={styles.sectionTitle}>Recetas / fases asignadas</p>
        {station.assignedRecipes?.length ? (
          station.assignedRecipes.map((recipe) => (
            <article key={`${recipe.name}-${recipe.phaseLabel}`} className={styles.card}>
              <strong>{recipe.name}</strong>
              {recipe.phaseLabel ? <p>{recipe.phaseLabel}</p> : null}
            </article>
          ))
        ) : (
          <p className={styles.empty}>Sin recetas asignadas.</p>
        )}
      </section>
    </aside>
  );
}
export default ProduccionStationDetailPanel;
