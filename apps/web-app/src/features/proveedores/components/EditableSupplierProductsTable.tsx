import {
  EmptyState,
  ProveedorActionButton,
  ProveedorCatalogTable,
  ProveedorProductModal,
  ProveedorProductModalField,
  NumberInput,
  ProveedorProductModalFields,
  RecetaFilterSelect,
  RecetaTextInput,
  type ProveedorCatalogTableRowProps,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/graphql-client';

import { PROVEEDOR_TABLE_SIZE, PROVEEDOR_UI_THEME, STOCK_UNIT_OPTIONS } from '../constants';
import { useSupplyItems } from '../hooks/useSupplyItems';
import {
  useCreateSupplierProduct,
  useUpdateSupplierProduct,
} from '../hooks/useSupplierProductMutations';
import { formatCop, formatMoq, formatStockUnit, getPriceTrend } from '../mappers/display';
import styles from '../proveedores.module.scss';
import type { StockUnit, SupplierCatalogRow } from '../types';

interface EditableSupplierProductsTableProps {
  supplierId: string;
  rows: SupplierCatalogRow[];
  linkedSupplyItemIds: Set<string>;
  isLoading?: boolean;
}

interface ProductDraft {
  supplyItemId: string;
  precioUnitario: number;
  unidadCompra: StockUnit;
  factorConversion: number;
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
}

interface ProductEditDraft {
  supplierProductId: string;
  precioUnitario: number;
  unidadCompra: StockUnit;
  factorConversion: number;
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
}

const EMPTY_DRAFT: ProductDraft = {
  supplyItemId: '',
  precioUnitario: 0,
  unidadCompra: 'KILOGRAMS',
  factorConversion: 1,
  tiempoEntregaDias: 1,
  esProveedorPrincipal: false,
};

const RECETA_THEME = 'dark' as const;

export default function EditableSupplierProductsTable({
  supplierId,
  rows,
  linkedSupplyItemIds,
  isLoading,
}: EditableSupplierProductsTableProps): React.JSX.Element {
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [editingRow, setEditingRow] = useState<SupplierCatalogRow | null>(null);
  const [editDraft, setEditDraft] = useState<ProductEditDraft | null>(null);
  const [supplySearch, setSupplySearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateSupplierProduct(supplierId);
  const updateMutation = useUpdateSupplierProduct(supplierId);
  const supplyItemsQuery = useSupplyItems(supplySearch, createOpen);

  const supplyOptions = useMemo(() => {
    const items = supplyItemsQuery.data ?? [];
    return items
      .filter((item) => !linkedSupplyItemIds.has(item.id) || item.id === createDraft.supplyItemId)
      .map((item) => ({
        value: item.id,
        label: `${item.nombre} (${item.codigoInterno})`,
      }));
  }, [createDraft.supplyItemId, linkedSupplyItemIds, supplyItemsQuery.data]);

  useEffect(() => {
    if (!editingRow) return;
    setEditDraft({
      supplierProductId: editingRow.supplierProductId,
      precioUnitario: editingRow.precioUnitario,
      unidadCompra: editingRow.unidadCompra,
      factorConversion: editingRow.factorConversion,
      tiempoEntregaDias: editingRow.tiempoEntregaDias,
      esProveedorPrincipal: editingRow.esProveedorPrincipal,
    });
  }, [editingRow]);

  const tableRows: ProveedorCatalogTableRowProps[] = useMemo(
    () =>
      rows.map((row) => {
        const trend = getPriceTrend(row.precioUnitario, row.precioAnterior);
        return {
          productName: row.productName,
          sku: row.sku,
          unit: formatStockUnit(row.unidadCompra),
          currentPrice: formatCop(row.precioUnitario),
          previousPrice: row.precioAnterior !== undefined ? formatCop(row.precioAnterior) : '—',
          moq: formatMoq(row.factorConversion, row.unidadCompra),
          status: row.catalogStatus,
          priceTrend: trend,
          theme: PROVEEDOR_UI_THEME,
          size: PROVEEDOR_TABLE_SIZE,
          rowKey: row.supplierProductId,
          onEdit: () => {
            setFormError(null);
            setEditingRow(row);
          },
        };
      }),
    [rows],
  );

  const closeCreateModal = (): void => {
    setCreateOpen(false);
    setCreateDraft(EMPTY_DRAFT);
    setSupplySearch('');
    setFormError(null);
  };

  const closeEditModal = (): void => {
    setEditingRow(null);
    setEditDraft(null);
    setFormError(null);
  };

  const handleSaveCreate = async (): Promise<void> => {
    setFormError(null);
    if (
      !createDraft.supplyItemId ||
      createDraft.precioUnitario <= 0 ||
      createDraft.factorConversion <= 0
    ) {
      setFormError('Completa insumo, precio y cantidad mínima (MOQ).');
      return;
    }
    try {
      await createMutation.mutateAsync({
        supplyItemId: createDraft.supplyItemId,
        precioUnitario: createDraft.precioUnitario,
        unidadCompra: createDraft.unidadCompra,
        factorConversion: createDraft.factorConversion,
        tiempoEntregaDias: createDraft.tiempoEntregaDias,
        esProveedorPrincipal: createDraft.esProveedorPrincipal,
      });
      closeCreateModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editDraft) return;
    setFormError(null);
    if (editDraft.precioUnitario <= 0 || editDraft.factorConversion <= 0) {
      setFormError('Precio y MOQ deben ser mayores a cero.');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editDraft.supplierProductId,
        input: {
          precioUnitario: editDraft.precioUnitario,
          unidadCompra: editDraft.unidadCompra,
          factorConversion: editDraft.factorConversion,
          tiempoEntregaDias: editDraft.tiempoEntregaDias,
          esProveedorPrincipal: editDraft.esProveedorPrincipal,
        },
      });
      closeEditModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const selectedSupply = supplyItemsQuery.data?.find(
    (item) => item.id === createDraft.supplyItemId,
  );

  return (
    <div className={styles.tabPanel}>
      <div className={styles.catalogHeader}>
        <ProveedorActionButton
          variant="new-product"
          theme={PROVEEDOR_UI_THEME}
          size="md"
          onClick={() => {
            setCreateOpen(true);
            setEditingRow(null);
            setFormError(null);
          }}
          disabled={createOpen || editingRow !== null || isLoading}
        />
      </div>

      <ProveedorCatalogTable
        rows={tableRows}
        theme={PROVEEDOR_UI_THEME}
        size={PROVEEDOR_TABLE_SIZE}
        emptyState={
          isLoading ? (
            'Cargando catálogo…'
          ) : rows.length === 0 ? (
            <EmptyState
              variant="create"
              theme="dark"
              title="Sin productos"
              description="Agrega el primer insumo al catálogo con el botón «Nuevo producto»."
            />
          ) : undefined
        }
      />

      <ProveedorProductModal
        open={createOpen}
        title="Nuevo producto"
        subtitle="Agregar insumo al catálogo del proveedor"
        theme={PROVEEDOR_UI_THEME}
        size="md"
        onClose={closeCreateModal}
        onCancel={closeCreateModal}
        onSave={() => void handleSaveCreate()}
        saveLoading={isSaving}
        saveDisabled={isSaving}
      >
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <ProveedorProductModalFields>
          <ProveedorProductModalField fullWidth label="Buscar insumo" htmlFor="supply-search">
            <RecetaTextInput
              id="supply-search"
              theme={RECETA_THEME}
              placeholder="Nombre o código interno…"
              value={supplySearch}
              onChange={(event) => setSupplySearch(event.target.value)}
            />
          </ProveedorProductModalField>
          <ProveedorProductModalField fullWidth label="Insumo" htmlFor="supply-item" required>
            <RecetaFilterSelect
              id="supply-item"
              theme={RECETA_THEME}
              size="md"
              options={[{ value: '', label: 'Seleccionar insumo…' }, ...supplyOptions]}
              value={createDraft.supplyItemId}
              onChange={(value) => {
                const selected = supplyItemsQuery.data?.find((item) => item.id === value);
                setCreateDraft((current) => ({
                  ...current,
                  supplyItemId: value,
                  unidadCompra: selected?.unidadBase ?? current.unidadCompra,
                }));
              }}
            />
          </ProveedorProductModalField>
          {selectedSupply && (
            <ProveedorProductModalField label="SKU" htmlFor="supply-sku">
              <RecetaTextInput
                id="supply-sku"
                theme={RECETA_THEME}
                value={selectedSupply.codigoInterno}
                readOnly
              />
            </ProveedorProductModalField>
          )}
          <ProveedorProductModalField label="Unidad" htmlFor="create-unit" required>
            <RecetaFilterSelect
              id="create-unit"
              theme={RECETA_THEME}
              size="md"
              options={STOCK_UNIT_OPTIONS}
              value={createDraft.unidadCompra}
              onChange={(value) =>
                setCreateDraft((current) => ({
                  ...current,
                  unidadCompra: value as StockUnit,
                }))
              }
            />
          </ProveedorProductModalField>
          <ProveedorProductModalField label="Precio (COP)" htmlFor="create-price" required>
            <NumberInput
              id="create-price"
              className={styles.modalNumberInput}
              variant="grouped"
              showSteppers={false}
              theme={RECETA_THEME}
              size="md"
              min={1}
              value={createDraft.precioUnitario}
              onChange={(precioUnitario) =>
                setCreateDraft((current) => ({ ...current, precioUnitario }))
              }
            />
          </ProveedorProductModalField>
          <ProveedorProductModalField label="MOQ (cantidad mínima)" htmlFor="create-moq" required>
            <NumberInput
              id="create-moq"
              className={styles.modalNumberInput}
              variant="grouped"
              showSteppers={false}
              theme={RECETA_THEME}
              size="md"
              min={1}
              maxCurrencyDigits={8}
              value={createDraft.factorConversion}
              onChange={(factorConversion) =>
                setCreateDraft((current) => ({
                  ...current,
                  factorConversion: factorConversion > 0 ? factorConversion : 1,
                }))
              }
            />
          </ProveedorProductModalField>
        </ProveedorProductModalFields>
      </ProveedorProductModal>

      <ProveedorProductModal
        open={editingRow !== null && editDraft !== null}
        title="Editar producto"
        subtitle={editingRow?.productName ?? 'Configurar precio y unidad'}
        theme={PROVEEDOR_UI_THEME}
        size="md"
        onClose={closeEditModal}
        onCancel={closeEditModal}
        onSave={() => void handleSaveEdit()}
        saveLoading={isSaving}
        saveDisabled={isSaving || !editDraft}
      >
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        {editDraft && editingRow && (
          <ProveedorProductModalFields>
            <ProveedorProductModalField fullWidth label="Producto" htmlFor="edit-product-name">
              <RecetaTextInput
                id="edit-product-name"
                theme={RECETA_THEME}
                value={editingRow.productName}
                readOnly
              />
            </ProveedorProductModalField>
            <ProveedorProductModalField label="SKU" htmlFor="edit-sku">
              <RecetaTextInput id="edit-sku" theme={RECETA_THEME} value={editingRow.sku} readOnly />
            </ProveedorProductModalField>
            <ProveedorProductModalField label="Unidad" htmlFor="edit-unit" required>
              <RecetaFilterSelect
                id="edit-unit"
                theme={RECETA_THEME}
                size="md"
                options={STOCK_UNIT_OPTIONS}
                value={editDraft.unidadCompra}
                onChange={(value) =>
                  setEditDraft((current) =>
                    current ? { ...current, unidadCompra: value as StockUnit } : current,
                  )
                }
              />
            </ProveedorProductModalField>
            <ProveedorProductModalField label="Precio (COP)" htmlFor="edit-price" required>
              <NumberInput
                id="edit-price"
                className={styles.modalNumberInput}
                variant="grouped"
                showSteppers={false}
                theme={RECETA_THEME}
                size="md"
                min={1}
                value={editDraft.precioUnitario}
                onChange={(precioUnitario) =>
                  setEditDraft((current) => (current ? { ...current, precioUnitario } : current))
                }
              />
            </ProveedorProductModalField>
            <ProveedorProductModalField label="MOQ (cantidad mínima)" htmlFor="edit-moq" required>
              <NumberInput
                id="edit-moq"
                className={styles.modalNumberInput}
                variant="grouped"
                showSteppers={false}
                theme={RECETA_THEME}
                size="md"
                min={1}
                maxCurrencyDigits={8}
                value={editDraft.factorConversion}
                onChange={(factorConversion) =>
                  setEditDraft((current) =>
                    current
                      ? {
                          ...current,
                          factorConversion: factorConversion > 0 ? factorConversion : 1,
                        }
                      : current,
                  )
                }
              />
            </ProveedorProductModalField>
          </ProveedorProductModalFields>
        )}
      </ProveedorProductModal>
    </div>
  );
}
