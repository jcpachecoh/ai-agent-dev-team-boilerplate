import React, { type JSX } from 'react';

import { ProduccionFilterChipGroup } from '../produccion-filter-chip-group';
import { ProduccionModuleTabs } from '../produccion-module-tabs';
import { ProduccionPlantShell } from '../produccion-plant-shell';
import { ProduccionPrimaryAction } from '../produccion-primary-action';
import { ProduccionRecipeDetailPanel } from '../produccion-recipe-detail-panel';
import { ProduccionRecipeTableHeader } from '../produccion-recipe-table-header';
import { ProduccionRecipeTableRow } from '../produccion-recipe-table-row';
import { ProduccionSubTabs } from '../produccion-sub-tabs';
import styles from './ProduccionRecipesMasterPreview.module.scss';
import type {
  ProduccionRecipeRowData,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';
export interface ProduccionRecipesMasterPreviewProps {
  rows?: ProduccionRecipeRowData[];
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
const rows: ProduccionRecipeRowData[] = [
  {
    name: 'Pollo asado porcionado',
    category: 'Proteínas',
    productName: 'Pollo asado 1/4',
    batchSizeLabel: '50 kg',
    phaseCount: 4,
    totalTimeLabel: '1h 40min',
    versionLabel: 'v2.3',
    status: 'published',
  },
  {
    name: 'Costillas BBQ',
    category: 'Proteínas',
    productName: 'Costillas BBQ 300g',
    batchSizeLabel: '30 kg',
    phaseCount: 4,
    totalTimeLabel: '2h 25min',
    versionLabel: 'v1.8',
    status: 'published',
    selected: true,
  },
  {
    name: 'Ensalada César',
    category: 'Ensaladas',
    productName: 'Ensalada César porción',
    batchSizeLabel: '20 kg',
    phaseCount: 2,
    totalTimeLabel: '35 min',
    versionLabel: 'v3.1',
    status: 'published',
  },
  {
    name: 'Papas fritas temporada',
    category: 'Acompañamientos',
    productName: 'Papas temporada 200g',
    batchSizeLabel: '40 kg',
    phaseCount: 3,
    totalTimeLabel: '33 min',
    versionLabel: 'v1.0',
    status: 'draft',
  },
];
export function ProduccionRecipesMasterPreview({
  rows: recipeRows = rows,
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionRecipesMasterPreviewProps): JSX.Element {
  const selected = recipeRows.find((row) => row.selected) ?? recipeRows[0];
  return (
    <div
      className={[styles.screen, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <ProduccionPlantShell theme={theme} size="xl">
        <ProduccionModuleTabs activeId="masters" theme={theme} size={size} />
        <ProduccionSubTabs activeId="recipes" theme={theme} size={size} />
        <section className={styles.contentHeader}>
          <h2 className={styles.title}>RECETAS DE PRODUCCIÓN — {recipeRows.length} recetas</h2>
          <ProduccionFilterChipGroup
            theme={theme}
            size="sm"
            chips={[
              { id: 'all', label: 'TODAS' },
              { id: 'proteins', label: 'PROTEÍNAS' },
              { id: 'salads', label: 'ENSALADAS' },
              { id: 'sides', label: 'ACOMPAÑAMIENTOS' },
            ]}
          />
          <ProduccionPrimaryAction label="NUEVA RECETA" theme={theme} size="sm" />
        </section>
        <main className={styles.content}>
          <div className={styles.tableWrap} role="table">
            <ProduccionRecipeTableHeader theme={theme} size="xl" />
            <div className={styles.rows} role="rowgroup">
              {recipeRows.map((row) => (
                <ProduccionRecipeTableRow key={row.name} {...row} theme={theme} size="xl" />
              ))}
            </div>
          </div>
          <ProduccionRecipeDetailPanel recipe={selected} theme={theme} size="md" />
        </main>
      </ProduccionPlantShell>
    </div>
  );
}
export default ProduccionRecipesMasterPreview;
