import {
  InventarioFormField,
  InventarioModal,
  InventarioSelect,
  type InventarioSelectOption,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { useSupplyCategories } from '@/features/inventario/hooks/useSupplyCategories';
import { productToFormValues } from '@/features/inventario/mappers/formValues';
import type { InventoryProduct, InventoryProductFormValues } from '@/types/inventory';
import { STOCK_UNIT_OPTIONS } from '@/types/inventory';
import type { UiTheme } from '@/constants/theme';

import { FormToggle } from './FormToggle';
import styles from './ProductFormModal.module.scss';

const unitOptions: InventarioSelectOption[] = STOCK_UNIT_OPTIONS.map((u) => ({
  value: u.value,
  label: u.label,
}));

export interface ProductFormModalProps {
  theme: UiTheme;
  open: boolean;
  mode: 'create' | 'edit';
  product?: InventoryProduct;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: InventoryProductFormValues) => void;
}

const emptyForm: InventoryProductFormValues = {
  sku: '',
  name: '',
  descripcion: '',
  categoryId: '',
  costPrice: '0',
  minStock: '0',
  maxStock: '100',
  currentStock: '0',
  unidadBase: 'UNIT',
  factorConversion: '1',
  aplicaVencimiento: false,
  aplicaLote: false,
};

export function ProductFormModal({
  theme,
  open,
  mode,
  product,
  saving = false,
  onClose,
  onSave,
}: ProductFormModalProps): React.JSX.Element {
  const categoriesQuery = useSupplyCategories();
  const [values, setValues] = useState<InventoryProductFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const categoryOptions: InventarioSelectOption[] = useMemo(() => {
    const items = categoriesQuery.data ?? [];
    return items.map((c) => ({ value: c.id, label: c.nombre }));
  }, [categoriesQuery.data]);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setValues(productToFormValues(product));
    } else {
      const firstCategory = categoriesQuery.data?.[0]?.id ?? '';
      setValues({ ...emptyForm, categoryId: firstCategory });
    }
    setFormError(null);
  }, [open, product, categoriesQuery.data]);

  const handleSave = () => {
    const cost = Number(values.costPrice);
    const min = Number(values.minStock);
    const max = Number(values.maxStock);
    const current = Number(values.currentStock);
    if (!values.sku.trim() || !values.name.trim() || !values.categoryId) {
      setFormError('Complete SKU, nombre y categoría.');
      return;
    }
    if (
      Number.isNaN(cost) ||
      Number.isNaN(min) ||
      Number.isNaN(max) ||
      (mode === 'create' && (Number.isNaN(current) || current < 0)) ||
      min > max
    ) {
      setFormError('Revise costo y stock (mínimo ≤ máximo).');
      return;
    }
    setFormError(null);
    onSave(values);
  };

  const update = (patch: Partial<InventoryProductFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  return (
    <InventarioModal
      open={open}
      title={mode === 'create' ? 'Crear Insumo' : 'Editar Insumo'}
      subtitle="Maestro de insumos — categoría, unidad y límites de bodega"
      onClose={onClose}
      onSave={handleSave}
      saveLoading={saving}
      theme={theme}
      size="xl"
    >
      <div className={styles.formGrid}>
        <InventarioFormField label="SKU *" theme={theme} size="md">
          <input
            id="insumo-sku"
            className={styles.input}
            value={values.sku}
            onChange={(e) => update({ sku: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Nombre *" theme={theme} size="md">
          <input
            id="insumo-nombre"
            className={styles.input}
            value={values.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Categoría" inputType="select" theme={theme} size="md">
          <InventarioSelect
            options={categoryOptions}
            value={values.categoryId}
            onChange={(v) => update({ categoryId: v })}
            theme={theme}
            size="md"
            aria-label="Categoría"
          />
        </InventarioFormField>
        <InventarioFormField label="Unidad base" inputType="select" theme={theme} size="md">
          <InventarioSelect
            options={unitOptions}
            value={values.unidadBase}
            onChange={(v) => update({ unidadBase: v as InventoryProductFormValues['unidadBase'] })}
            theme={theme}
            size="md"
            aria-label="Unidad base"
          />
        </InventarioFormField>
        <InventarioFormField label="Costo promedio (CPP)" theme={theme} size="md">
          <input
            className={styles.input}
            type="number"
            value={values.costPrice}
            onChange={(e) => update({ costPrice: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Factor de conversión" theme={theme} size="md">
          <input
            className={styles.input}
            type="number"
            value={values.factorConversion}
            onChange={(e) => update({ factorConversion: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Stock Mínimo" theme={theme} size="md">
          <input
            className={styles.input}
            type="number"
            value={values.minStock}
            onChange={(e) => update({ minStock: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Stock Máximo" theme={theme} size="md">
          <input
            className={styles.input}
            type="number"
            value={values.maxStock}
            onChange={(e) => update({ maxStock: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Stock actual" theme={theme} size="md">
          <input
            className={mode === 'edit' ? `${styles.input} ${styles.inputReadonly}` : styles.input}
            type="number"
            min="0"
            value={values.currentStock}
            readOnly={mode === 'edit'}
            onChange={mode === 'edit' ? undefined : (e) => update({ currentStock: e.target.value })}
          />
        </InventarioFormField>
        <div className={styles.togglePair}>
          <FormToggle
            label="Aplica vencimiento"
            checked={values.aplicaVencimiento}
            onChange={(checked) => update({ aplicaVencimiento: checked })}
          />
          <FormToggle
            label="Aplica lote"
            checked={values.aplicaLote}
            onChange={(checked) => update({ aplicaLote: checked })}
          />
        </div>
        {formError ? <span className={styles.errorText}>{formError}</span> : null}
      </div>
    </InventarioModal>
  );
}
