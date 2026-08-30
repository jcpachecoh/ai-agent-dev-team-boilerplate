import { ChevronRight } from 'lucide-react';
import type { JSX } from 'react';

import type { PlantDashboardThemeProps } from '../shared/plant-workstation-types';
import styles from './PlantLocationSelectFooter.module.scss';

export interface PlantLocationSelectFooterProps extends PlantDashboardThemeProps {
  continueLabel?: string;
  cancelLabel?: string;
  canContinue?: boolean;
  isSubmitting?: boolean;
  onContinue?: () => void;
  onCancel?: () => void;
}

export function PlantLocationSelectFooter({
  continueLabel = 'Continuar',
  cancelLabel = 'Cancelar',
  canContinue = false,
  isSubmitting = false,
  onContinue,
  onCancel,
  theme = 'dark',
  className,
}: PlantLocationSelectFooterProps): JSX.Element {
  return (
    <footer
      className={[styles.footer, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      data-testid="plant-location-select-footer"
    >
      <button
        type="button"
        className={styles.cancelButton}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </button>

      <button
        type="button"
        className={[styles.continueButton, canContinue ? styles.continueEnabled : null]
          .filter(Boolean)
          .join(' ')}
        onClick={onContinue}
        disabled={!canContinue || isSubmitting}
        data-testid="plant-location-continue-button"
      >
        <span>{continueLabel}</span>
        <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
      </button>
    </footer>
  );
}

export default PlantLocationSelectFooter;
