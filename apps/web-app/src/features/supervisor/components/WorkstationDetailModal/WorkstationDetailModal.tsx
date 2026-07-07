import { ProduccionStationDetailPanel, type ProduccionStationDetailData } from '@restopsiq/ui';
import { useEffect, useId, type JSX } from 'react';

import type { UiTheme } from '@/constants/theme';

import styles from './WorkstationDetailModal.module.scss';

export interface WorkstationDetailModalProps {
  open: boolean;
  station?: ProduccionStationDetailData;
  theme?: UiTheme;
  onClose: () => void;
}

export function WorkstationDetailModal({
  open,
  station,
  theme = 'dark',
  onClose,
}: WorkstationDetailModalProps): JSX.Element | null {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !station) {
    return null;
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={styles.srOnly}>
          Detalle de estación {station.code}
        </h2>
        <ProduccionStationDetailPanel
          station={station}
          theme={theme}
          size="md"
          onClose={onClose}
          className={styles.panel}
        />
      </div>
    </div>
  );
}
