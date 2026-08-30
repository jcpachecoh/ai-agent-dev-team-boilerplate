import { InventarioFormField, InventarioModal } from '@restopsiq/ui';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import type { UiTheme } from '@/constants/theme';
import type { InventoryResolvedAlert } from '@/types/inventory';

import styles from './ResolvedAlertDetailModal.module.scss';

export interface ResolvedAlertDetailModalProps {
  alert: InventoryResolvedAlert | null;
  theme: UiTheme;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ResolvedAlertDetailModal({
  alert,
  theme,
  onClose,
}: ResolvedAlertDetailModalProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!alert?.note) return;
    try {
      await navigator.clipboard.writeText(alert.note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable (e.g. non-https dev), ignore silently
    }
  };

  return (
    <InventarioModal
      open={alert !== null}
      title="Detalle de alerta resuelta"
      subtitle={alert?.product ?? ''}
      onClose={onClose}
      onSave={onClose}
      saveLabel="Cerrar"
      saveAccent="teal"
      theme={theme}
      size="xl"
    >
      {alert && (
        <div className={styles.grid}>
          <InventarioFormField label="Insumo" theme={theme} size="md">
            <span className={styles.value}>{alert.product}</span>
          </InventarioFormField>

          <InventarioFormField label="Proveedor principal" theme={theme} size="md">
            <span className={styles.value}>{alert.supplier}</span>
          </InventarioFormField>

          <InventarioFormField label="Stock actual" theme={theme} size="md">
            <span className={[styles.value, styles.mono].join(' ')}>{alert.currentStock}</span>
          </InventarioFormField>

          <InventarioFormField label="Stock mínimo" theme={theme} size="md">
            <span className={[styles.value, styles.mono].join(' ')}>{alert.threshold}</span>
          </InventarioFormField>

          <InventarioFormField
            label="Resuelta el"
            theme={theme}
            size="md"
            className={styles.fullWidth}
          >
            <span className={styles.value}>{formatDate(alert.resolvedAt)}</span>
          </InventarioFormField>

          <div className={[styles.noteField, styles.fullWidth].join(' ')}>
            <InventarioFormField label="Razón de resolución" theme={theme} size="md">
              {alert.note ? (
                <div className={styles.noteWrap}>
                  <p className={styles.noteText}>{alert.note}</p>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => void handleCopy()}
                    aria-label={copied ? 'Nota copiada' : 'Copiar nota'}
                    title={copied ? 'Copiado' : 'Copiar texto'}
                  >
                    {copied ? (
                      <Check className={styles.copyIcon} aria-hidden />
                    ) : (
                      <Copy className={styles.copyIcon} aria-hidden />
                    )}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              ) : (
                <span className={styles.emptyNote}>Sin razón registrada</span>
              )}
            </InventarioFormField>
          </div>
        </div>
      )}
    </InventarioModal>
  );
}
