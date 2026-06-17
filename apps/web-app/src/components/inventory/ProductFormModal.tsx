import {
  InventarioFormField,
  InventarioModal,
  InventarioSelect,
  type InventarioSelectOption,
} from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import type { InventoryProduct, InventoryProductFormValues } from '@/types/inventory';
import { INVENTORY_CATEGORIES } from '@/types/inventory';

import styles from './ProductFormModal.module.scss';

const categoryOptions: InventarioSelectOption[] = INVENTORY_CATEGORIES.filter(
  (c) => c.value !== 'all',
).map((c) => ({ value: c.value, label: c.label }));

const supplierOptions: InventarioSelectOption[] = [
  { value: 'Agrosuper', label: 'Agrosuper' },
  { value: 'Frigorífico del Llano', label: 'Frigorífico del Llano' },
  { value: 'Arroz Diana', label: 'Arroz Diana' },
  { value: 'Lloreda', label: 'Lloreda' },
  { value: 'Agro Boyacá', label: 'Agro Boyacá' },
];

export interface ProductFormModalProps {
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
  categoryId: 'carnes',
  supplier: 'Agrosuper',
  costPrice: '',
  sellingPrice: '',
  minStock: '',
  maxStock: '',
};

export function ProductFormModal({
  open,
  mode,
  product,
  saving = false,
  onClose,
  onSave,
}: ProductFormModalProps): React.JSX.Element {
  const [values, setValues] = useState<InventoryProductFormValues>(emptyForm);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setValues({
        sku: product.sku,
        name: product.name,
        categoryId: product.categoryId,
        supplier: product.supplier,
        costPrice: String(product.costPrice),
        sellingPrice: String(product.sellingPrice),
        minStock: String(product.minStock),
        maxStock: String(product.maxStock),
      });
    } else {
      setValues(emptyForm);
    }
    setPriceError(null);
  }, [open, product]);

  const handleSave = () => {
    const cost = Number(values.costPrice);
    const sell = Number(values.sellingPrice);
    if (Number.isNaN(cost) || Number.isNaN(sell) || cost >= sell) {
      setPriceError('El precio de costo debe ser menor al precio de venta.');
      return;
    }
    if (!values.sku.trim() || !values.name.trim()) {
      return;
    }
    setPriceError(null);
    onSave(values);
  };

  const update = (patch: Partial<InventoryProductFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  return (
    <InventarioModal
      open={open}
      title={mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
      subtitle="Configurar información del producto"
      onClose={onClose}
      onSave={handleSave}
      saveLoading={saving}
      theme="dark"
      size="xl"
    >
      <div className={styles.formGrid}>
        <InventarioFormField label="SKU *" theme="dark" size="md">
          <input
            className={styles.input}
            value={values.sku}
            onChange={(e) => update({ sku: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Nombre *" theme="dark" size="md">
          <input
            className={styles.input}
            value={values.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Categoría" inputType="select" theme="dark" size="md">
          <InventarioSelect
            options={categoryOptions}
            value={values.categoryId}
            onChange={(v) => update({ categoryId: v })}
            theme="dark"
            size="md"
          />
        </InventarioFormField>
        <InventarioFormField label="Proveedor" inputType="select" theme="dark" size="md">
          <InventarioSelect
            options={supplierOptions}
            value={values.supplier}
            onChange={(v) => update({ supplier: v })}
            theme="dark"
            size="md"
          />
        </InventarioFormField>
        <InventarioFormField label="Precio Costo" theme="dark" size="md">
          <input
            className={styles.input}
            type="number"
            value={values.costPrice}
            onChange={(e) => update({ costPrice: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField
          label="Precio Venta"
          theme="dark"
          size="md"
          className={priceError ? styles.fieldError : undefined}
        >
          <input
            className={styles.input}
            type="number"
            value={values.sellingPrice}
            onChange={(e) => update({ sellingPrice: e.target.value })}
          />
          {priceError ? <span className={styles.errorText}>{priceError}</span> : null}
        </InventarioFormField>
        <InventarioFormField label="Stock Mínimo" theme="dark" size="md">
          <input
            className={styles.input}
            type="number"
            value={values.minStock}
            onChange={(e) => update({ minStock: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Stock Máximo" theme="dark" size="md">
          <input
            className={styles.input}
            type="number"
            value={values.maxStock}
            onChange={(e) => update({ maxStock: e.target.value })}
          />
        </InventarioFormField>
      </div>
    </InventarioModal>
  );
}
