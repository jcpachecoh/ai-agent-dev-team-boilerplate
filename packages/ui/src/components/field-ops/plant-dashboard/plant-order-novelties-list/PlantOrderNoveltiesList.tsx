import {
  AlertTriangle,
  ChefHat,
  CircleAlert,
  PackageX,
  PauseCircle,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import type { JSX } from 'react';

import type {
  PlantDashboardThemeProps,
  PlantNoveltyType,
  PlantOrderNoveltyItem,
} from '../shared/plant-workstation-types';
import {
  getPlantNoveltyTypeLabel,
  PLANT_NOVELTY_SEVERITY_OPTIONS,
} from '../shared/plant-workstation-types';
import styles from './PlantOrderNoveltiesList.module.scss';

const NOVELTY_ICONS: Record<PlantNoveltyType, typeof AlertTriangle> = {
  INGREDIENT_SHORTAGE: PackageX,
  EQUIPMENT_FAILURE: Wrench,
  RECIPE_DEVIATION: ChefHat,
  UNPLANNED_STOP: PauseCircle,
  SAFETY_INCIDENT: ShieldAlert,
  QUALITY_ISSUE: CircleAlert,
  OTHER: AlertTriangle,
};

function formatNoveltyDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function severityLabel(severity: PlantOrderNoveltyItem['severity']): string {
  return (
    PLANT_NOVELTY_SEVERITY_OPTIONS.find((option) => option.value === severity)?.label ?? severity
  );
}

export interface PlantOrderNoveltiesListProps extends PlantDashboardThemeProps {
  items: PlantOrderNoveltyItem[];
  loading?: boolean;
}

export function PlantOrderNoveltiesList({
  items,
  loading = false,
  theme = 'dark',
  className,
}: PlantOrderNoveltiesListProps): JSX.Element {
  if (loading) {
    return (
      <ul
        className={[styles.list, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
        aria-busy="true"
        aria-label="Cargando novedades"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className={styles.skeletonRow} />
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={[styles.empty, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      >
        <p>Sin novedades registradas</p>
      </div>
    );
  }

  return (
    <ul className={[styles.list, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const Icon = NOVELTY_ICONS[item.noveltyType];
        const resolved = Boolean(item.resolvedAt);
        const isHighOpen = !resolved && item.severity === 'HIGH';
        return (
          <li
            key={item.id}
            className={[
              styles.item,
              resolved && styles.itemResolved,
              isHighOpen && styles.itemHighOpen,
            ].join(' ')}
          >
            <div className={styles.itemHeader}>
              <div className={styles.typeRow}>
                <Icon size={16} aria-hidden className={styles.typeIcon} />
                <span className={styles.typeLabel}>
                  {getPlantNoveltyTypeLabel(item.noveltyType)}
                </span>
              </div>
              <span
                className={[styles.badge, resolved ? styles.badgeResolved : styles.badgeOpen].join(
                  ' ',
                )}
              >
                {resolved ? 'Resuelta' : 'Abierta'}
              </span>
            </div>
            <p className={styles.description}>{item.description}</p>
            <div className={styles.metaRow}>
              <span
                className={[
                  styles.severityChip,
                  styles[`severity--${item.severity.toLowerCase()}`],
                ].join(' ')}
              >
                {severityLabel(item.severity)}
              </span>
              <time className={styles.timestamp} dateTime={item.createdAt}>
                {formatNoveltyDate(item.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default PlantOrderNoveltiesList;
