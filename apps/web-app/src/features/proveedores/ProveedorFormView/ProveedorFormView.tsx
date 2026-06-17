import {
  NumberInput,
  ProveedorFormActions,
  ProveedorFormHeader,
  ProveedorFormSection,
  ProveedorProductModalField,
  ProveedorProductModalFields,
  RecetaFilterSelect,
  RecetaTextInput,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getErrorMessage } from '@/lib/graphql-client';

import { CONDICION_PAGO_OPTIONS, PROVEEDOR_TABLE_SIZE, TIPO_OPTIONS } from '../constants';
import { useSupplier } from '../hooks/useSupplier';
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSupplierMutations';
import styles from '../proveedores.module.scss';
import type { CondicionPago, SupplierFormValues, SupplierTipo } from '../types';
import { useUiTheme } from '@/hooks/useUiTheme';

const EMPTY_FORM: SupplierFormValues = {
  razonSocial: '',
  nit: '',
  dv: '',
  tipo: 'PERSONA_JURIDICA',
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
  contactoNombre: '',
  condicionPago: 'DIAS_30',
  cupoCredito: 0,
  calificacion: 3,
  isActive: true,
};

interface ProveedorFormViewProps {
  mode: 'create' | 'edit';
}

export default function ProveedorFormView({ mode }: ProveedorFormViewProps): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const supplierQuery = useSupplier(mode === 'edit' ? supplierId : undefined);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const existing = supplierQuery.data ?? undefined;

  const [form, setForm] = useState<SupplierFormValues>(EMPTY_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    setForm({
      razonSocial: existing.razonSocial,
      nit: existing.nit,
      dv: existing.dv ?? '',
      tipo: existing.tipo,
      direccion: existing.direccion ?? '',
      ciudad: existing.ciudad ?? '',
      telefono: existing.telefono ?? '',
      email: existing.email ?? '',
      contactoNombre: existing.contactoNombre ?? '',
      condicionPago: existing.condicionPago,
      cupoCredito: existing.cupoCredito,
      calificacion: existing.calificacion,
      isActive: existing.isActive,
    });
  }, [existing]);

  const isValid = form.razonSocial.trim().length > 0 && form.nit.trim().length > 0;

  const title = useMemo(() => (mode === 'create' ? 'NUEVO PROVEEDOR' : 'EDITAR PROVEEDOR'), [mode]);

  const updateField = <K extends keyof SupplierFormValues>(
    key: K,
    value: SupplierFormValues[K],
  ): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCancel = (): void => {
    if (mode === 'edit' && supplierId) {
      navigate(`/proveedores/${supplierId}`);
      return;
    }
    navigate('/proveedores');
  };

  const handleSave = async (): Promise<void> => {
    if (!isValid) return;
    setSaveError(null);
    const payload: SupplierFormValues = {
      ...form,
      razonSocial: form.razonSocial.trim(),
      nit: form.nit.trim(),
      dv: form.dv?.trim() || undefined,
      direccion: form.direccion?.trim() || undefined,
      ciudad: form.ciudad?.trim() || undefined,
      telefono: form.telefono?.trim() || undefined,
      email: form.email?.trim() || undefined,
      contactoNombre: form.contactoNombre?.trim() || undefined,
    };

    try {
      if (mode === 'create') {
        const created = await createMutation.mutateAsync(payload);
        navigate(`/proveedores/${created.id}`);
        return;
      }

      if (supplierId) {
        await updateMutation.mutateAsync({ id: supplierId, values: payload });
        navigate(`/proveedores/${supplierId}`);
      }
    } catch (error) {
      setSaveError(getErrorMessage(error));
    }
  };

  if (mode === 'edit' && supplierId && supplierQuery.isPending) {
    return (
      <div className={`${styles.content} ${styles.contentPadded}`}>
        <p className={styles.stateMessage}>Cargando proveedor…</p>
      </div>
    );
  }

  if (mode === 'edit' && supplierId && (supplierQuery.isError || !existing)) {
    return (
      <div className={`${styles.content} ${styles.contentPadded}`}>
        <p className={styles.notFound}>Proveedor no encontrado.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.content} ${styles.contentPadded}`}>
      <ProveedorFormHeader title={title} onBack={handleCancel} theme={theme} size="xl" />

      <div className={styles.formPage}>
        <ProveedorFormSection title="Información general" theme={theme} size={PROVEEDOR_TABLE_SIZE}>
          <div className={styles.formSectionFields}>
            <ProveedorProductModalFields>
              <ProveedorProductModalField
                fullWidth
                label="Razón social"
                htmlFor="razonSocial"
                required
              >
                <RecetaTextInput
                  id="razonSocial"
                  theme={theme}
                  value={form.razonSocial}
                  onChange={(event) => updateField('razonSocial', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="NIT" htmlFor="nit" required>
                <RecetaTextInput
                  id="nit"
                  theme={theme}
                  value={form.nit}
                  onChange={(event) => updateField('nit', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="DV" htmlFor="dv">
                <RecetaTextInput
                  id="dv"
                  theme={theme}
                  value={form.dv}
                  onChange={(event) => updateField('dv', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Tipo" htmlFor="tipo">
                <RecetaFilterSelect
                  id="tipo"
                  options={TIPO_OPTIONS}
                  value={form.tipo}
                  onChange={(value) => updateField('tipo', value as SupplierTipo)}
                  theme={theme}
                  size={PROVEEDOR_TABLE_SIZE}
                />
              </ProveedorProductModalField>
            </ProveedorProductModalFields>
          </div>
        </ProveedorFormSection>

        <ProveedorFormSection title="Contacto" theme={theme} size={PROVEEDOR_TABLE_SIZE}>
          <div className={styles.formSectionFields}>
            <ProveedorProductModalFields>
              <ProveedorProductModalField label="Email" htmlFor="email">
                <RecetaTextInput
                  id="email"
                  type="email"
                  theme={theme}
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Teléfono" htmlFor="telefono">
                <RecetaTextInput
                  id="telefono"
                  theme={theme}
                  value={form.telefono}
                  onChange={(event) => updateField('telefono', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField fullWidth label="Dirección" htmlFor="direccion">
                <RecetaTextInput
                  id="direccion"
                  theme={theme}
                  value={form.direccion}
                  onChange={(event) => updateField('direccion', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Ciudad" htmlFor="ciudad">
                <RecetaTextInput
                  id="ciudad"
                  theme={theme}
                  value={form.ciudad}
                  onChange={(event) => updateField('ciudad', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Nombre contacto" htmlFor="contactoNombre">
                <RecetaTextInput
                  id="contactoNombre"
                  theme={theme}
                  value={form.contactoNombre}
                  onChange={(event) => updateField('contactoNombre', event.target.value)}
                />
              </ProveedorProductModalField>
            </ProveedorProductModalFields>
          </div>
        </ProveedorFormSection>

        <ProveedorFormSection
          title="Condiciones comerciales"
          theme={theme}
          size={PROVEEDOR_TABLE_SIZE}
        >
          <div className={styles.formSectionFields}>
            <ProveedorProductModalFields>
              <ProveedorProductModalField label="Condición de pago" htmlFor="condicionPago">
                <RecetaFilterSelect
                  id="condicionPago"
                  options={CONDICION_PAGO_OPTIONS}
                  value={form.condicionPago}
                  onChange={(value) => updateField('condicionPago', value as CondicionPago)}
                  theme={theme}
                  size={PROVEEDOR_TABLE_SIZE}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Cupo crédito (COP)" htmlFor="cupoCredito">
                <NumberInput
                  id="cupoCredito"
                  variant="currency"
                  value={form.cupoCredito}
                  onChange={(value) => updateField('cupoCredito', value)}
                  theme={theme}
                  size={PROVEEDOR_TABLE_SIZE}
                  min={0}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Calificación (0–5)" htmlFor="calificacion">
                <NumberInput
                  id="calificacion"
                  value={form.calificacion}
                  onChange={(value) => updateField('calificacion', value)}
                  theme={theme}
                  size={PROVEEDOR_TABLE_SIZE}
                  min={0}
                  max={5}
                  step={0.1}
                  decimalPlaces={1}
                />
              </ProveedorProductModalField>
              {mode === 'edit' && (
                <ProveedorProductModalField label="Estado">
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => updateField('isActive', event.target.checked)}
                    />
                    Proveedor activo
                  </label>
                </ProveedorProductModalField>
              )}
            </ProveedorProductModalFields>
          </div>
        </ProveedorFormSection>

        {saveError && (
          <p className={styles.formError} role="alert">
            {saveError}
          </p>
        )}

        <ProveedorFormActions
          theme={theme}
          size={PROVEEDOR_TABLE_SIZE}
          onCancel={handleCancel}
          onSave={() => void handleSave()}
          saveDisabled={!isValid || createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  );
}
