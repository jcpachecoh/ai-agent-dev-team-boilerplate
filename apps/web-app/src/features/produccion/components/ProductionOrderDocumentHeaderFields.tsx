import { InventarioDateField, InventarioFormField } from '@restopsiq/ui';

import { useUiTheme } from '@/hooks/useUiTheme';

import type { ProductionOrderDocumentHeader } from '../mappers/document-form';
import styles from '../produccion.module.scss';

export interface ProductionOrderDocumentHeaderFieldsProps {
  batchCount: number;
  packageWeight: string | null;
  value: ProductionOrderDocumentHeader;
  onChange: (next: ProductionOrderDocumentHeader) => void;
  disabled?: boolean;
  notesLabel?: string;
}

function formatPackageWeightDisplay(value: string | null): string {
  if (value == null) return '—';
  const text = value.trim();
  return text || '—';
}

export function ProductionOrderDocumentHeaderFields({
  batchCount,
  packageWeight,
  value,
  onChange,
  disabled = false,
  notesLabel = 'Observaciones',
}: ProductionOrderDocumentHeaderFieldsProps): React.JSX.Element {
  const theme = useUiTheme();

  const patch = (partial: Partial<ProductionOrderDocumentHeader>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <>
      <InventarioFormField
        theme={theme}
        size="md"
        label="Cantidad de batches a producir"
        inputType="input"
      >
        <input
          className={styles.input}
          type="text"
          value={String(batchCount)}
          disabled
          readOnly
          aria-label="Cantidad de batches a producir"
        />
      </InventarioFormField>

      <InventarioFormField theme={theme} size="md" label="Lote PT" inputType="input">
        <input
          className={styles.input}
          type="text"
          value={value.lotNumber}
          disabled={disabled}
          onChange={(event) => patch({ lotNumber: event.target.value })}
          placeholder="Ej. LOTE-0134"
          aria-label="Lote PT"
        />
      </InventarioFormField>

      <InventarioFormField
        theme={theme}
        size="md"
        label="Fecha de producción"
        inputType="input"
        htmlFor="op-production-date"
      >
        <InventarioDateField
          theme={theme}
          size="md"
          value={value.productionDate}
          disabled={disabled}
          onChange={(next) => patch({ productionDate: next })}
          aria-label="Fecha de producción"
        />
      </InventarioFormField>

      <InventarioFormField
        theme={theme}
        size="md"
        label="Fecha de entrega"
        inputType="input"
        htmlFor="op-delivery-date"
      >
        <InventarioDateField
          theme={theme}
          size="md"
          value={value.deliveryDate}
          disabled={disabled}
          onChange={(next) => patch({ deliveryDate: next })}
          aria-label="Fecha de entrega"
        />
      </InventarioFormField>

      <InventarioFormField
        theme={theme}
        size="md"
        label="Peso aprox. por paquete (kg)"
        inputType="input"
      >
        <input
          className={styles.input}
          type="text"
          value={formatPackageWeightDisplay(packageWeight)}
          disabled
          readOnly
          aria-label="Peso aproximado por paquete"
        />
      </InventarioFormField>

      <InventarioFormField
        theme={theme}
        size="md"
        label={notesLabel}
        inputType="input"
        className={styles.formGridWide}
      >
        <input
          className={styles.input}
          type="text"
          value={value.notes}
          disabled={disabled}
          onChange={(event) => patch({ notes: event.target.value })}
          placeholder="Observaciones del documento OP"
          aria-label={notesLabel}
        />
      </InventarioFormField>
    </>
  );
}
