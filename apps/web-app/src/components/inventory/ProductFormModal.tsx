import {
  InventarioFormField,
  InventarioModal,
  InventarioSelect,
  type InventarioSelectOption,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { useSupplyCategories } from '@/features/inventario/hooks/useSupplyCategories';
import { resolveNextSupplyItemSku } from '@/features/inventario/utils/nextSupplyItemSku';
import {
  COMODATOS_CATEGORY_NOMBRE,
  DOTACION_CATEGORY_NOMBRE,
  DOTACION_SUBCATEGORIES,
  getGenderOptions,
  getSizeOptions,
} from '@/features/inventario/constants/dotacion';
import { productToFormValues } from '@/features/inventario/mappers/formValues';
import type { InventoryProduct, InventoryProductFormValues } from '@/types/inventory';
import { STOCK_UNIT_OPTIONS } from '@/types/inventory';
import type { UiTheme } from '@/constants/theme';

import { FormToggle } from './FormToggle';
import styles from './ProductFormModal.module.scss';

const SIMPLE_STOCK_CATEGORY_NAMES = ['Menaje', 'Activos menores', 'Activos fijos'];

type CategoryType = 'dotacion' | 'comodatos' | 'simple' | 'default';

function getCategoryType(nombre: string | undefined): CategoryType {
  if (!nombre) return 'default';
  if (nombre === DOTACION_CATEGORY_NOMBRE) return 'dotacion';
  if (nombre === COMODATOS_CATEGORY_NOMBRE) return 'comodatos';
  if (SIMPLE_STOCK_CATEGORY_NAMES.includes(nombre)) return 'simple';
  return 'default';
}

const unitOptions: InventarioSelectOption[] = STOCK_UNIT_OPTIONS.map((u) => ({
  value: u.value,
  label: u.label,
}));

const subcategoriaOptions: InventarioSelectOption[] = DOTACION_SUBCATEGORIES.map((s) => ({
  value: s,
  label: s,
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
  isActive: true,
  subcategoria: '',
  genero: '',
  talla: '',
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
  const [skuLoading, setSkuLoading] = useState(false);

  const categoryOptions: InventarioSelectOption[] = useMemo(() => {
    const items = categoriesQuery.data ?? [];
    return items.map((c) => ({ value: c.id, label: c.nombre }));
  }, [categoriesQuery.data]);

  const selectedCategory = useMemo(
    () => categoriesQuery.data?.find((c) => c.id === values.categoryId),
    [categoriesQuery.data, values.categoryId],
  );

  const categoryType = getCategoryType(selectedCategory?.nombre);

  const genderOptions: InventarioSelectOption[] = useMemo(() => {
    if (!values.subcategoria) return [];
    return getGenderOptions(values.subcategoria).map((g) => ({ value: g, label: g }));
  }, [values.subcategoria]);

  const sizeOptions: InventarioSelectOption[] = useMemo(() => {
    if (!values.subcategoria || !values.genero) return [];
    return getSizeOptions(values.subcategoria, values.genero).map((t) => ({ value: t, label: t }));
  }, [values.subcategoria, values.genero]);

  // Reset form when modal opens
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

  // Auto-generate SKU on category change in create mode
  useEffect(() => {
    if (!open || mode !== 'create' || !values.categoryId) return;

    const category = categoriesQuery.data?.find((item) => item.id === values.categoryId);
    if (!category) return;

    let cancelled = false;
    setSkuLoading(true);

    void resolveNextSupplyItemSku(category)
      .then((sku) => {
        if (!cancelled) setValues((prev) => ({ ...prev, sku }));
      })
      .catch(() => {
        if (!cancelled) setValues((prev) => ({ ...prev, sku: '' }));
      })
      .finally(() => {
        if (!cancelled) setSkuLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, mode, values.categoryId, categoriesQuery.data]);

  const update = (patch: Partial<InventoryProductFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const handleCategoryChange = (v: string) => {
    update({ categoryId: v, subcategoria: '', genero: '', talla: '' });
  };

  const handleSubcategoriaChange = (v: string) => {
    const genders = getGenderOptions(v);
    // Auto-select gender when there's only one option (e.g. Unisex-only subcategorias)
    const autoGenero = genders.length === 1 ? genders[0] : '';
    update({ subcategoria: v, genero: autoGenero, talla: '' });
  };

  const handleGeneroChange = (v: string) => {
    update({ genero: v, talla: '' });
  };

  const handleSave = () => {
    if (!values.name.trim() || !values.categoryId) {
      setFormError('Complete nombre y categoría.');
      return;
    }
    if (!values.sku.trim()) {
      setFormError('Seleccione una categoría para generar el SKU.');
      return;
    }

    if (categoryType === 'dotacion') {
      if (!values.subcategoria) {
        setFormError('Seleccione una subcategoría.');
        return;
      }
      if (!values.genero) {
        setFormError('Seleccione el género.');
        return;
      }
      if (!values.talla) {
        setFormError('Seleccione la talla.');
        return;
      }
    }

    if (categoryType !== 'comodatos') {
      const min = Number(values.minStock);
      const max = Number(values.maxStock);
      if (Number.isNaN(min) || Number.isNaN(max) || min > max) {
        setFormError('Revise stock mínimo y máximo (mínimo ≤ máximo).');
        return;
      }
    }

    setFormError(null);

    // Comodatos: force stock to 0
    const finalValues: InventoryProductFormValues =
      categoryType === 'comodatos' ? { ...values, minStock: '0', maxStock: '0' } : values;

    onSave(finalValues);
  };

  const skuPlaceholder =
    mode === 'create'
      ? skuLoading
        ? 'Generando SKU…'
        : 'Se genera al elegir categoría'
      : values.sku;

  const subtitle =
    mode === 'create'
      ? 'El código interno se asigna por categoría (ej. DOT-000001, MEN-000001…)'
      : 'Maestro de insumos — categoría, unidad y límites de bodega';

  return (
    <InventarioModal
      open={open}
      title={mode === 'create' ? 'Crear Insumo' : 'Editar Insumo'}
      subtitle={subtitle}
      onClose={onClose}
      onSave={handleSave}
      saveLoading={saving}
      theme={theme}
      size="xl"
    >
      <div className={styles.formGrid}>
        {/* Header row — always shown */}
        <div className={styles.categoryRow}>
          <InventarioFormField label="Categoría *" inputType="select" theme={theme} size="md">
            <InventarioSelect
              options={categoryOptions}
              value={values.categoryId}
              onChange={handleCategoryChange}
              theme={theme}
              size="md"
              aria-label="Categoría"
            />
          </InventarioFormField>
          <InventarioFormField label="SKU *" theme={theme} size="md">
            <input
              id="insumo-sku"
              className={`${styles.input} ${styles.inputReadonly}`}
              value={values.sku}
              readOnly
              placeholder={skuPlaceholder}
              aria-busy={skuLoading}
            />
          </InventarioFormField>
        </div>

        {/* ── DOTACIÓN ─────────────────────────────────────── */}
        {categoryType === 'dotacion' && (
          <>
            <InventarioFormField label="Subcategoría *" inputType="select" theme={theme} size="md">
              <InventarioSelect
                options={subcategoriaOptions}
                value={values.subcategoria}
                onChange={handleSubcategoriaChange}
                theme={theme}
                size="md"
                aria-label="Subcategoría"
              />
            </InventarioFormField>
            <InventarioFormField label="Nombre *" theme={theme} size="md">
              <input
                className={styles.input}
                value={values.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </InventarioFormField>
            <InventarioFormField label="Género *" inputType="select" theme={theme} size="md">
              <InventarioSelect
                options={genderOptions}
                value={values.genero}
                onChange={handleGeneroChange}
                theme={theme}
                size="md"
                aria-label="Género"
              />
            </InventarioFormField>
            <InventarioFormField label="Talla *" inputType="select" theme={theme} size="md">
              <InventarioSelect
                options={sizeOptions}
                value={values.talla}
                onChange={(v) => update({ talla: v })}
                theme={theme}
                size="md"
                aria-label="Talla"
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
          </>
        )}

        {/* ── COMODATOS ─────────────────────────────────────── */}
        {categoryType === 'comodatos' && (
          <InventarioFormField
            label="Nombre *"
            theme={theme}
            size="md"
            className={styles.fullWidthField}
          >
            <input
              className={styles.input}
              value={values.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </InventarioFormField>
        )}

        {/* ── SIMPLE (Menaje, Activos menores, Activos fijos) ─ */}
        {categoryType === 'simple' && (
          <>
            <InventarioFormField
              label="Nombre *"
              theme={theme}
              size="md"
              className={styles.fullWidthField}
            >
              <input
                className={styles.input}
                value={values.name}
                onChange={(e) => update({ name: e.target.value })}
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
          </>
        )}

        {/* ── DEFAULT (categorías existentes — comportamiento original) */}
        {categoryType === 'default' && (
          <>
            <InventarioFormField label="Nombre *" theme={theme} size="md">
              <input
                className={styles.input}
                value={values.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </InventarioFormField>
            <InventarioFormField label="Unidad base" inputType="select" theme={theme} size="md">
              <InventarioSelect
                options={unitOptions}
                value={values.unidadBase}
                onChange={(v) =>
                  update({ unidadBase: v as InventoryProductFormValues['unidadBase'] })
                }
                theme={theme}
                size="md"
                aria-label="Unidad base"
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
          </>
        )}

        {formError ? (
          <span className={[styles.errorText, styles.fullWidthField].join(' ')}>{formError}</span>
        ) : null}
      </div>
    </InventarioModal>
  );
}
