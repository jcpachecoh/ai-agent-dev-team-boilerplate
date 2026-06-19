import { LayoutGrid, List } from 'lucide-react';
import type { JSX } from 'react';

import type {
  AsistenciaSize,
  AsistenciaTheme,
  AsistenciaViewMode,
} from '../shared/asistencia-types';
import styles from './AsistenciaViewToggle.module.scss';

export interface AsistenciaViewToggleProps {
  value?: AsistenciaViewMode;
  onChange?: (mode: AsistenciaViewMode) => void;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
}

const options: Array<{ id: AsistenciaViewMode; label: string; icon: JSX.Element }> = [
  { id: 'grid', label: 'Vista en cuadrícula', icon: <LayoutGrid aria-hidden /> },
  { id: 'list', label: 'Vista en lista', icon: <List aria-hidden /> },
];

export function AsistenciaViewToggle({
  value = 'grid',
  onChange,
  theme = 'dark',
  size = 'sm',
  className,
}: AsistenciaViewToggleProps): JSX.Element {
  return (
    <div
      className={[styles.toggle, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Modo de visualización"
    >
      {options.map((option, index) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            className={[styles.button, isActive && styles.active, index > 0 && styles.withDivider]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={isActive}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange?.(option.id)}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}

export default AsistenciaViewToggle;
