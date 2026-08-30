import { InventarioFormField, InventarioModal } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import type { UiTheme } from '@/constants/theme';

import styles from './ProductFormModal.module.scss';

export interface ResolveAlertModalProps {
  theme: UiTheme;
  open: boolean;
  productName: string;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (note: string | undefined) => void;
}

export function ResolveAlertModal({
  theme,
  open,
  productName,
  saving = false,
  onClose,
  onConfirm,
}: ResolveAlertModalProps): React.JSX.Element {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setNote('');
  }, [open]);

  const handleSave = () => {
    onConfirm(note.trim() || undefined);
  };

  return (
    <InventarioModal
      open={open}
      title="Resolver alerta"
      subtitle={`Marcando como resuelta la alerta de stock bajo para: ${productName}`}
      onClose={onClose}
      onSave={handleSave}
      saveLoading={saving}
      theme={theme}
      size="xl"
    >
      <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
        <InventarioFormField
          label="Razón de resolución (opcional)"
          theme={theme}
          size="md"
        >
          <textarea
            className={styles.textarea}
            value={note}
            maxLength={500}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. Se realizó ajuste de inventario / Se recibió compra / Reconteo físico"
          />
        </InventarioFormField>
      </div>
    </InventarioModal>
  );
}
