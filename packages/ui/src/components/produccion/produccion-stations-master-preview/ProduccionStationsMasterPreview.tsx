import React, { type JSX } from 'react';

import { ProduccionFilterChipGroup } from '../produccion-filter-chip-group';
import { ProduccionModuleTabs } from '../produccion-module-tabs';
import { ProduccionPlantShell } from '../produccion-plant-shell';
import { ProduccionPrimaryAction } from '../produccion-primary-action';
import { ProduccionStationDetailPanel } from '../produccion-station-detail-panel';
import { ProduccionStationTableHeader } from '../produccion-station-table-header';
import { ProduccionStationTableRow } from '../produccion-station-table-row';
import { ProduccionSubTabs } from '../produccion-sub-tabs';
import styles from './ProduccionStationsMasterPreview.module.scss';
import type {
  ProduccionSize,
  ProduccionStationRowData,
  ProduccionTheme,
} from '../shared/produccion-types';
export interface ProduccionStationsMasterPreviewProps {
  rows?: ProduccionStationRowData[];
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
const rows: ProduccionStationRowData[] = [
  {
    code: 'EST-01',
    name: 'Mise en place',
    location: 'Zona A - Preparación',
    type: 'Preparación',
    typeTone: 'preparation',
    capacityLabel: '3 op.',
    status: 'active',
    recipeCountLabel: '2 recetas',
  },
  {
    code: 'EST-02',
    name: 'Corte y Deshuese',
    location: 'Zona A - Preparación',
    type: 'Procesamiento',
    typeTone: 'processing',
    capacityLabel: '4 op.',
    status: 'active',
    recipeCountLabel: '1 receta',
  },
  {
    code: 'EST-03',
    name: 'Parrilla Central',
    location: 'Zona B - Cocción',
    type: 'Cocción',
    typeTone: 'cooking',
    capacityLabel: '2 op.',
    status: 'active',
    recipeCountLabel: '2 recetas',
  },
  {
    code: 'EST-04',
    name: 'Línea Fría',
    location: 'Zona C - Refrigeración',
    type: 'Enfriamiento',
    typeTone: 'cooling',
    capacityLabel: '2 op.',
    status: 'active',
    recipeCountLabel: '1 receta',
    selected: true,
  },
  {
    code: 'EST-05',
    name: 'Frituras',
    location: 'Zona B - Cocción',
    type: 'Cocción',
    typeTone: 'cooking',
    capacityLabel: '3 op.',
    status: 'active',
    recipeCountLabel: '1 receta',
  },
  {
    code: 'EST-06',
    name: 'Empaque y Despacho',
    location: 'Zona D - Empaque',
    type: 'Empaque',
    typeTone: 'packing',
    capacityLabel: '4 op.',
    status: 'active',
    recipeCountLabel: '1 receta',
  },
  {
    code: 'EST-07',
    name: 'Cámara de Maduración',
    location: 'Zona C - Refrigeración',
    type: 'Maduración',
    typeTone: 'maturation',
    capacityLabel: '1 op.',
    status: 'inactive',
    recipeCountLabel: '—',
  },
  {
    code: 'EST-08',
    name: 'Lavado y Sanitización',
    location: 'Zona A - Preparación',
    type: 'Sanitización',
    typeTone: 'sanitation',
    capacityLabel: '2 op.',
    status: 'maintenance',
    recipeCountLabel: '—',
  },
];
export function ProduccionStationsMasterPreview({
  rows: stationRows = rows,
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionStationsMasterPreviewProps): JSX.Element {
  const selected = stationRows.find((row) => row.selected) ?? stationRows[0];
  return (
    <div
      className={[styles.screen, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <ProduccionPlantShell theme={theme} size="xl">
        <ProduccionModuleTabs activeId="masters" theme={theme} size={size} />
        <ProduccionSubTabs activeId="stations" theme={theme} size={size} />
        <section className={styles.contentHeader}>
          <h2 className={styles.title}>
            ESTACIONES DE PRODUCCIÓN — {stationRows.length} registros
          </h2>
          <ProduccionFilterChipGroup theme={theme} size="sm" />
          <ProduccionPrimaryAction label="NUEVA ESTACIÓN" theme={theme} size="sm" />
        </section>
        <main className={styles.content}>
          <div className={styles.tableWrap} role="table">
            <ProduccionStationTableHeader theme={theme} size="xl" />
            <div className={styles.rows} role="rowgroup">
              {stationRows.map((row) => (
                <ProduccionStationTableRow key={row.code} {...row} theme={theme} size="xl" />
              ))}
            </div>
          </div>
          <ProduccionStationDetailPanel station={selected} theme={theme} size="md" />
        </main>
      </ProduccionPlantShell>
    </div>
  );
}
export default ProduccionStationsMasterPreview;
