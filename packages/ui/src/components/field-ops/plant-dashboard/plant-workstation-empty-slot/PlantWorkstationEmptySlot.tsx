import { Plus } from 'lucide-react';
import type { JSX } from 'react';

import type { FieldOpsTheme } from '../../shared/field-ops-types';
import type { PlantWorkstationDensity } from '../shared/plant-workstation-types';
import styles from './PlantWorkstationEmptySlot.module.scss';

export interface PlantWorkstationEmptySlotProps {
  density?: PlantWorkstationDensity;
  theme?: FieldOpsTheme;
  onAssign?: () => void;
  className?: string;
}

export function PlantWorkstationEmptySlot({
  density = 'compact',
  theme = 'dark',
  onAssign,
  className,
}: PlantWorkstationEmptySlotProps): JSX.Element {
  return (
    <button
      type="button"
      className={[styles.slot, styles[`density--${density}`], styles[`theme--${theme}`], className]
        .filter(Boolean)
        .join(' ')}
      onClick={onAssign}
      data-testid="workstation-empty-slot"
    >
      <span className={styles.iconRing} aria-hidden>
        <Plus size={density === 'compact' ? 20 : 26} strokeWidth={1.5} />
      </span>
      <span className={styles.primary}>Sin orden asignada</span>
      <span className={styles.secondary}>Toca para asignar</span>
    </button>
  );
}

export default PlantWorkstationEmptySlot;
