import { Building2, MapPin } from 'lucide-react';
import type { JSX } from 'react';

import type {
  PlantDashboardThemeProps,
  PlantLocationOption,
} from '../shared/plant-workstation-types';
import styles from './PlantLocationCard.module.scss';

export interface PlantLocationCardProps extends PlantDashboardThemeProps {
  location: PlantLocationOption;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: (locationId: string) => void;
}

function resolveLocationCode(location: PlantLocationOption): string {
  if (location.code?.trim()) {
    return location.code.trim().toUpperCase();
  }
  return `LOC-${location.id.slice(-4).toUpperCase()}`;
}

export function PlantLocationCard({
  location,
  selected = false,
  disabled = false,
  onSelect,
  theme = 'dark',
  className,
}: PlantLocationCardProps): JSX.Element {
  const code = resolveLocationCode(location);

  return (
    <button
      type="button"
      className={[
        styles.card,
        styles[`theme--${theme}`],
        selected ? styles.selected : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      onClick={() => onSelect?.(location.id)}
      data-testid={`plant-location-card-${code}`}
      aria-pressed={selected}
    >
      <div className={styles.topRow}>
        <span className={styles.iconWrap} aria-hidden>
          <Building2 size={18} strokeWidth={1.75} />
        </span>
        <span className={styles.code}>{code}</span>
      </div>

      <div className={styles.body}>
        <p className={styles.name}>{location.name}</p>
        {location.city ? (
          <p className={styles.cityRow}>
            <MapPin size={11} strokeWidth={2} aria-hidden />
            <span>{location.city}</span>
          </p>
        ) : null}
      </div>

      {location.address ? <p className={styles.address}>{location.address}</p> : null}
    </button>
  );
}

export default PlantLocationCard;
