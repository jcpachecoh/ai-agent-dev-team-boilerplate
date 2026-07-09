import type { ReactNode } from 'react';

import styles from './VacationEmpleadoTable.module.scss';

export type VacationTableIconActionVariant = 'approve' | 'reject' | 'download';

interface VacationTableIconActionProps {
  label: string;
  variant: VacationTableIconActionVariant;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function VacationTableIconAction({
  label,
  variant,
  icon,
  onClick,
  disabled = false,
}: VacationTableIconActionProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={[styles.iconAction, styles[`iconAction_${variant}`]].join(' ')}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-tooltip={label}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
